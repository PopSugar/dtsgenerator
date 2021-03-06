/// <reference path="../typings/tsd.d.ts" />

import fs = require("fs");
import path = require("path");
import program = require("commander");
import mkdirp = require("mkdirp");
var asyncblock = require("asyncblock");
var glob = require('glob');

import dtsgenerator = require("./index");

var pkg = require("../package.json");


// <hoge> is reuired, [hoge] is optional
program
  .version(pkg.version)
  .usage('[options] <file ... | file patterns using node-glob>')
  .option("-o, --out [file]", "output d.ts filename")
  .parse(process.argv);

interface ICommandOptions {
  out?: string;
  args: string[];
}
var opts: ICommandOptions = <any>program;

if (opts.args.length === 0) {
  program.help();
} else {
  processGenerate();
}


function processGenerate(): void {
  asyncblock((flow: any) => {
    opts.args.forEach((arg) => {
      var files = glob.sync(arg);
      files.forEach((file: any) => {
        fs.readFile(file, {encoding: 'utf-8'}, flow.add(file));
      });
    });
    var contents = flow.wait();
    var schemas: dtsgenerator.model.IJsonSchema[] = Object.keys(contents).map((key) => contents[key]);
    var result = dtsgenerator(schemas);

    if (opts.out) {
      flow.sync(mkdirp(path.dirname(opts.out), flow.callback()));
      flow.sync(fs.writeFile(opts.out, result, { encoding: 'utf-8' }, flow.callback()));
    } else {
      console.log(result);
    }
  });
}

