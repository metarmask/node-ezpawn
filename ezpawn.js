const ChildProcess = require("child_process");

class SpawnError extends Error {
	constructor(message, io) {
		super(message + " (stderr:) " + (io.err ? io.err.toString() : ""));
		Object.assign(this, io);
	}
}

class TimeoutError extends SpawnError {
	constructor(io) {
		super("Child timed out", io);
	}
}

class SignalExit extends SpawnError {
	constructor(signal, io) {
		super("Child received " + signal, io);
		this.signal = signal;
	}
}

class NonZeroExit extends SpawnError {
	constructor(code, io) {
		if(code === 0) throw new RangeError("NonZeroExit is for non-zero exit codes");
		super("Child exited with non-zero " + code, io);
		this.code = code;
	}
}

class EZpawn {
	static async spawn(command, args, inOptions = {}) {
		return new Promise((resolve, reject) => {
const options = Object.assign({
	stdio: "pipe",
}, inOptions);
const process = ChildProcess.spawn(command, args, inOptions);
const pipes = {};
for(const [ioName, processKey] of [["out", "stdout"], ["err", "stderr"]]) {
	const pipe = process[processKey];
	const collect = {length: 0, buffers: []};
	pipe.on("data", buffer => {
		collect.length += buffer.length;
		collect.buffers.push(buffer);
	});
	pipes[ioName] = collect;
}
process.on("exit", (code, signal) => {
	const pipesConcat = {};
	for(const [ioName, collect] of Object.entries(pipes)) {
		pipesConcat[ioName] = Buffer.concat(collect.buffers, collect.length);
	}
	let error;
	if(signal) {
		error = new SignalExit(signal, pipesConcat);
	} else if(code !== 0) {
		error = new NonZeroExit(code, pipesConcat);
	}
	if(error) {
		return reject(error);
	}
	return resolve(pipesConcat);
});
		});
	}
}
Object.assign(EZpawn, {SpawnError, TimeoutError, SignalExit, NonZeroExit});

module.exports = EZpawn;
