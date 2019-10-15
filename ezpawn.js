const ChildProcess = require("child_process")

class SpawnError extends Error {
	constructor(message, io) {
		super(`${message} (stderr:) ${io.err ? io.err.toString() : ""}`)
		Object.assign(this, io)
	}
}

class TimeoutError extends SpawnError {
	constructor(io) {
		super("Child timed out", io)
	}
}

class SignalExit extends SpawnError {
	constructor(signal, io) {
		super(`Child received ${signal}`, io)
		this.signal = signal
	}
}

class NonZeroExit extends SpawnError {
	constructor(code, io) {
		if(code === 0) throw new RangeError("Exit code 0 is not an error")
		super(`Child exited with non-zero ${code}`, io)
		this.code = code
	}
}

class EZpawn {

static async spawn(...args) {
	return new Promise((resolve, reject) => {
		new EZpawn(resolve, reject, args)
	})
}

constructor(resolve, reject, spawnArgs) {
	this.resolve = resolve
	this.reject = reject
	const [command, args, inOptions = {}] = spawnArgs
	const options = Object.assign({
		stdio: "pipe"
	}, inOptions)
	this.process = ChildProcess.spawn(command, args, options)
	this.process.on("exit", this.onExit.bind(this))
	this.setupStreams()
}

setupStreams() {
	this.streams = {}
	for(const longName of EZpawn.streamNames) {
		const shortName = longName.substring("std".length)
		const stream = {length: 0, buffers: []}
		this.streams[shortName] = stream
		this.process[longName].on("data", buffer => {
			stream.length += buffer.length
			stream.buffers.push(buffer)
		})
	}
}

onExit(code, signal) {
	const streamsOut = {}
	for(const [name, stream] of Object.entries(this.streams)) {
		streamsOut[name] = Buffer.concat(stream.buffers, stream.length)
	}
	if(signal) return this.reject(new SignalExit(signal, streamsOut))
	if(code !== 0) return this.reject(new NonZeroExit(code, streamsOut))
	return this.resolve(streamsOut)
}

}
Object.defineProperties(EZpawn, {
	streamNames: {value: ["stdout", "stderr"]}
})
Object.assign(EZpawn, {SpawnError, TimeoutError, SignalExit, NonZeroExit})

module.exports = EZpawn
