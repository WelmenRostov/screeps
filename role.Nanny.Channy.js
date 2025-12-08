const creepMovement = require('./creepMovement');

let roleNanny = {
    run(creep) {
	const storage = creep.room.storage;
	if (!storage) return;

	// Пополнение
	if (creep.store.getUsedCapacity() === 0) {
	    if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
		creepMovement.moveTo(creep, storage, { reusePath: 10 });
	    }
	    return;
	}

	// 1. Spawn
	let spawn = creep.room.find(FIND_MY_SPAWNS)
	    .find(s => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0);

	if (spawn) {
	    if (creep.transfer(spawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
		creepMovement.moveTo(creep, spawn, { reusePath: 5 });
	    }
	    return;
	}

	// 2. Extensions
	let extensions = creep.room.find(FIND_STRUCTURES, {
	    filter: s => s.structureType === STRUCTURE_EXTENSION &&
		s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
	});

	if (extensions.length) {
	    let target = creep.pos.findClosestByPath(extensions);
	    if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
		creepMovement.moveTo(creep, target, { reusePath: 5 });
	    }
	    return;
	}

	// 3. Towers
	let towers = creep.room.find(FIND_STRUCTURES, {
	    filter: s => s.structureType === STRUCTURE_TOWER &&
		s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
	});

	if (towers.length) {
	    let target = creep.pos.findClosestByPath(towers);
	    if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
		creepMovement.moveTo(creep, target, { reusePath: 5 });
	    }
	    return;
	}

	// Idle — просто стоит рядом со storage
	creepMovement.moveTo(creep, storage, { reusePath: 20 });
    }
};

module.exports = roleNanny;
