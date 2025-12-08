// ===============================
// main.base — рабочая версия с логами
// ===============================

const roleBuilder     = require('role.Builder.Channy');
const roleNanny       = require('role.Nanny.Channy');
const roleLocalMiner  = require('role.LocalMiner.Channy');
const roleMover       = require('role.Muver.Chunny');
const roleUpdater     = require('role.Updater.Chunny');
const roleHauler     = require('role.Hauler.Chunny');

const spawnManager = require('system.spawn');

function run() {
    try {
	console.log("✅ main.base.run() стартует");

	// 1. Очистка памяти
	if (Memory.creeps) {
	    for (let name in Memory.creeps) {
		if (!Game.creeps[name]) {
		    delete Memory.creeps[name];
		    console.log(`🗑 Удалён Memory.creep: ${name}`);
		}
	    }
	}

	// 2. CPU
	if (!Memory.cpuStats) Memory.cpuStats = {};
	const cpuBeforeTick = Game.cpu.getUsed();

	// 3. Менеджер спавна
	try {
	    const cpuBefore = Game.cpu.getUsed();
	    if (spawnManager && typeof spawnManager.run === "function") {
		spawnManager.run();
	    } else {
		console.log("⚠️ spawnManager.run() недоступен");
	    }
	    Memory.cpuStats["spawn"] = Game.cpu.getUsed() - cpuBefore;
	} catch (err) {
	    console.log(`❌ Spawn Manager Error: ${err}`);
	}
	// 4. Основной цикл крипов
	let totalCreepCPU = 0;
	let roleCPU = {};

	if (Game.creeps) {
	    for (let name in Game.creeps) {
		const creep = Game.creeps[name];
		const startCPU = Game.cpu.getUsed();

		try {
		    switch (creep.memory.role) {
			case 'Builder':       roleBuilder.run(creep); break;
			case 'Nanny':       roleNanny.run(creep); break;
			case 'LocalMiner':  roleLocalMiner.run(creep); break;
			case 'Mover':       roleMover.run(creep); break;
			case 'Updater':     roleUpdater.run(creep); break;
			case 'Hauler':     roleHauler.run(creep); break;
		    }
		} catch (err) {
		    console.log(`❌ Error in ${creep.memory.role} (${creep.name}): ${err}`);
		}

		const used = Game.cpu.getUsed() - startCPU;
		totalCreepCPU += used;

		if (!roleCPU[creep.memory.role]) roleCPU[creep.memory.role] = 0;
		roleCPU[creep.memory.role] += used;
	    }
	}

	const totalTickCPU = Game.cpu.getUsed() - cpuBeforeTick;
	console.log(`🟦 CPU крипов: ${totalCreepCPU.toFixed(4)}`);
	console.log(`🟧 CPU тика: ${totalTickCPU.toFixed(4)}`);

    } catch (err) {
	console.log("❌ Ошибка в main.base.run():", err);
    }
}

module.exports = {
    run: run,
    loop: run
};
