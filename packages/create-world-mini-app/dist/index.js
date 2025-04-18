#!/usr/bin/env node
import e from "chalk";
import { Command as d } from "commander";
import g from "degit";
import { execa as y } from "execa";
import r from "fs-extra";
import c from "node:path";
import p from "prompts";
var a=new d;async function f(){a.name("create-world-mini-app").description("Bootstrap a new Worldcoin Mini App project.").argument("[project-name]","The name for the new project directory").option("-i, --install","Install dependencies after cloning",!0).option("--no-install","Do not install dependencies after cloning").parse(process.argv);let s=a.opts(),o=a.args[0];o||(o=(await p({type:"text",name:"projectName",message:"What is the name of your project?",initial:"my-world-app"})).projectName),o||(console.error(e.red("Project name is required.")),process.exit(1));let n=c.resolve(process.cwd(),o);if(r.existsSync(n)){let{overwrite:t}=await p({type:"confirm",name:"overwrite",message:`Directory ${e.cyan(o)} already exists. Overwrite?`,initial:!1});t||(console.log(e.yellow("Aborted.")),process.exit(0)),console.log(e.yellow(`Overwriting directory ${e.cyan(o)}...`)),await r.remove(n)}console.log(`Creating project ${e.cyan(o)}...`);try{let t=g("worldcoin/minikit-js/demo/next-15-template#main",{cache:!1,force:!0,verbose:!1});t.on("info",l=>{console.log(l.message)}),await t.clone(n),console.log(e.green("Template cloned successfully!"));let i=c.join(n,".env.sample"),m=c.join(n,".env.local");if(r.existsSync(i)&&(await r.copy(i,m),console.log(e.blue("Created .env.local from .env.sample"))),s.install){console.log("Installing dependencies...");try{await y("npm",["install"],{cwd:n,stdio:"inherit"}),console.log(e.green("Dependencies installed successfully!"))}catch(l){console.error(e.red("Failed to install dependencies:"),l),console.log(e.yellow("Please install dependencies manually by running:")),console.log(e.cyan(`  cd ${o}`)),console.log(e.cyan("  npm install"))}}console.log(`
${e.green("Success!")} Created ${e.cyan(o)} at ${e.cyan(n)}
`),console.log(`Inside that directory, you can run several commands:
`),console.log(e.cyan("  npm run dev")),console.log(`We suggest that you begin by typing:
`),console.log(e.cyan(`  cd ${o}`)),s.install||console.log(e.cyan("  npm install")),console.log(e.cyan(`  npm run dev
`)),console.log(e.blue("Check the .env.local file and follow the setup instructions in README.md")),process.exit(0)}catch(t){console.error(e.red("Failed to create project:"),t),await r.remove(n),process.exit(1)}}f().catch(s=>{console.error(e.red("An unexpected error occurred:"),s),process.exit(1)});
