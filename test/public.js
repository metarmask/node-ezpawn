/* eslint-env mocha */
/* eslint-disable no-unused-expressions, no-magic-numbers */
const EZpawn = require("../index.js")
const Chai = require("chai")
const ChaiAsPromised = require("chai-as-promised")
Chai.use(ChaiAsPromised)
const {expect} = Chai

describe("EZpawn", function() {
	this.slow(150)
	describe("spawn()", () => {
		let childProcess
		let origSetupStreams = EZpawn.prototype.setupStreams
		const spawnResult = {
			out: Buffer.from("out\n"),
			err: Buffer.from("err\n")
		}
		before("Process thief", () => {
			origSetupStreams = EZpawn.prototype.setupStreams
			EZpawn.prototype.setupStreams = function() {
				childProcess = this.process
				/* eslint-disable-next-line prefer-rest-params */
				origSetupStreams.apply(this, arguments)
			}
		})
		it("resolves to a spawn result", () => {
			return expect(EZpawn.spawn("node", ["-p", `console.error("err"); "out"`]))
				.to.eventually.become(spawnResult)
		})
		it("passes through options", () => {
			return expect(
				EZpawn.spawn(
					"node",
					["-p", "process.env.key"],
					{env: {key: "value"}}
				)
			).to.eventually.have.deep.property("out", Buffer.from("value\n"))
		})
		it("rejects to SignalExit with signal in message", () => {
			const signal = "SIGINT"
			const promise =	EZpawn.spawn(
				"node",
				["-e", `
					setTimeout(() => {}, 500);
					console.error("err");
					console.log("out")`])
			childProcess.stdout.on("data", () => {
				childProcess.kill(signal)
			})
			return expect(promise)
				.to.eventually.be.rejectedWith(EZpawn.SignalExit, signal)
				.and.to.deep.include(spawnResult)
		})
		it("rejects to NonZeroExit with code in message", () => {
			const code = "73"
			return expect(EZpawn.spawn(
				"node",
				["-e", `
					console.error("err")
					console.log("out")
					process.exit(${code})`]
			))
				.to.eventually.be.rejectedWith(EZpawn.NonZeroExit, code)
				.and.to.deep.include(spawnResult)
		})
		it("concatenates all of a stream", () => {
			const promise =
				EZpawn.spawn("node", ["-e", `console.log("na"); console.log("na")`])
			return expect(promise)
				.to.eventually.deep.include({out: Buffer.from("na\nna\n")})
		})
		after("Process thief", () => {
			EZpawn.prototype.setupStreams = origSetupStreams
		})
	})
	describe("SpawnError", () => {
		it("is accessible from class", () => {
			expect(EZpawn.SpawnError).to.exist
		})
	})
	describe("SignalExit", () => {
		it("is accessible from class", () => {
			expect(EZpawn.SignalExit).to.exist
		})
		it("extends SpawnError", () => {
			expect(EZpawn.SignalExit.prototype).to.be.instanceOf(EZpawn.SpawnError)
		})
		it("includes error stream in message")
	})
	describe("NonZeroExit", () => {
		it("is accessible from class", () => {
			expect(EZpawn.NonZeroExit).to.exist
		})
		it("extends SpawnError", () => {
			expect(EZpawn.NonZeroExit.prototype).to.be.instanceOf(EZpawn.SpawnError)
		})
		it("includes error stream in message", () => {
			const stderr = "stderr"
			return expect(EZpawn.spawn(
				"node",
				["-e", `
					console.error("${stderr}")
					process.exit(1)`]
			))
				.to.eventually.be.rejectedWith(EZpawn.NonZeroExit, stderr)
		})
	})
})
