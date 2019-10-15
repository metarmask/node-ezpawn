# EZpawn
Easy process spawning.

## Example
```js
const EZpawn = require("ezpawn")
(async () => {
  try {
    const {out, err} = await EZpawn.spawn("echo", ["hi", "there"])
    console.log("Process output:", out.toString(), err.toString())
  } catch(error) {
    if(!(error instanceof EZpawn.SpawnError)) throw error
    const {out, err} = error
    console.log(`An error occurred after this output: ${out.toString()}`)
  }
})()
```

## Public API
### SpawnResult
The result of a spawned child process.
#### \<Buffer> out
Buffer of the standard output stream.
#### \<Buffer> err
Buffer of the standard error stream.

### class EZpawn
The object this module exports.
#### class SpawnError extends Error
Is: SpawnResult\
Extended by: SignalExit, NonZeroExit

An error of a spawned child process. Displays the SpawnResult.err as a string in the error message.

#### class SignalExit extends EZpawn.SpawnError
The spawned child process exited because of a signal.
##### \<string> signal
The signal.

#### class NonZeroExit extends EZpawn.SpawnError
The spawned process exited with a non-zero exit code.
##### \<number> code
The exit code.

### async spawn(command, args, options)
Arguments are passed to `require("child_process").spawn`.

Resolves to: \<SpawnResult>\
Rejects to: \<SignalExit> if the process exits after receiving a signal\
Rejects to: \<NonZeroExit> if the process exits with a non-zero exit code.
