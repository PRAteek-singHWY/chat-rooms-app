<!-- initialising backend -->
npm init -y initialisng a node js project (cfreating a package.json file)

npx tsc --init #initialising teh empty ts.config,json fie

scriptd{
"dev" : "tsc -b (for compliling teh code [thsi converst our typescript code to a js file ]) && node ./dist/index.js" (to run the code) ,
}
-
-
-
<!-- library for websockets -->

there exists multiple libraries for HTTP like hono,express,koa
similarly for websockets many libraries

we will use ws -> npm i ws @types/ws
-
-
-
🪄 Enter @types/ws

@types/ws is a helper package that tells TypeScript:

“Hey, here’s what the ws library looks like — what classes, functions, and properties it has.”

“Hey TypeScript, here’s a description file that tells you what’s inside this library —
all its classes, functions, properties, and types —
so now you can understand it and stop showing errors.”
-
-
-
now we are creating our own WEB-SOCKET


<!-- initialising frontend -->

npm create vite@latest (creates a react application)

