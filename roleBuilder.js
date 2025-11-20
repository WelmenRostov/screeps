const creepMovement = require('./creepMovement');
const { isNannyReserveContainer } = require('./variables');

let roleBuilder = {
    /** @param {Creep} creep **/
    run: function(creep) {
    // Иконка над строителем: строго над крипом, без шлейфа
    new RoomVisual(creep.room.name).text('🔧', creep.pos.x, creep.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });
	if (creep.store[RESOURCE_ENERGY] === 0) {
	    creep.memory.working = false;
	}

	if (creep.store.getFreeCapacity() === 0) {
	    creep.memory.working = true;
	}

	if (creep.memory.working) {
	    // 1) В приоритете ремонтируем повреждённые дороги если они меньше 50%
	    let damagedRoad = creep.pos.findClosestByPath(FIND_STRUCTURES, {
		filter: (s) => s.structureType === STRUCTURE_ROAD && s.hits < s.hitsMax * 0.5
	    });

	    if (damagedRoad) {
		if (creep.repair(damagedRoad) === ERR_NOT_IN_RANGE) {
		    creepMovement.moveTo(creep, damagedRoad, { visualizePathStyle: { stroke: '#ffff00' } });
		}
		return;
	    }

	    // 2) Ремонтируем повреждённые здания (только если повреждение > 70%)
	    let damagedStructure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
		filter: (s) => s.hits < s.hitsMax * 0.3 && s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART && s.structureType !== STRUCTURE_ROAD
	    });

	    if (damagedStructure) {
		if (creep.repair(damagedStructure) === ERR_NOT_IN_RANGE) {
		    creepMovement.moveTo(creep, damagedStructure, { visualizePathStyle: { stroke: '#ff0000' } });
		}
		return;
	    }

	    // 3) Строим любые другие стройки (кроме стен и рампартов)
	    let nonWallSite = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
		filter: (site) => site.structureType !== STRUCTURE_WALL && site.structureType !== STRUCTURE_RAMPART
	    });

	    if (nonWallSite) {
		if (creep.build(nonWallSite) === ERR_NOT_IN_RANGE) {
		    creepMovement.moveTo(creep, nonWallSite, { visualizePathStyle: { stroke: '#00ff00' } });
		}
		return;
	    }

	    // 4) Ремонтируем слабые стены/рампарты до 100К
	    let weakWall = creep.pos.findClosestByPath(FIND_STRUCTURES, {
		filter: (s) => (s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART) && s.hits < 3000000 /*s.hits < s.hitsMax * 0.9*/  // до 10% от максимума

	    });

	    if (weakWall) {
		if (creep.repair(weakWall) === ERR_NOT_IN_RANGE) {
		    creepMovement.moveTo(creep, weakWall, { visualizePathStyle: { stroke: '#ff8800' } });
		}
		return;
	    }

	    // 5) Если ничего другого нет — строим стены
	    let wallToBuild = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
		filter: (site) => site.structureType === STRUCTURE_WALL || site.structureType === STRUCTURE_RAMPART
	    });

	    if (wallToBuild) {
		if (creep.build(wallToBuild) === ERR_NOT_IN_RANGE) {
		    creepMovement.moveTo(creep,wallToBuild, { visualizePathStyle: { stroke: '#00ff00' } });
		}
	    }
	} else {
	    // Пополняем запас: сперва STORAGE, затем руины, затем контейнеры, в конце — добываем
	    let storage = creep.pos.findClosestByPath(FIND_STRUCTURES, {
		filter: (s) => s.structureType === STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] > 0
	    });

	    if (storage) {
		if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
		    creepMovement.moveTo(creep,storage, { visualizePathStyle: { stroke: '#ffaa00' } });
		}
		return;
	    }

	    let ruin = creep.pos.findClosestByPath(FIND_RUINS, {
		filter: (r) => r.store[RESOURCE_ENERGY] > 0
	    });

	    if (ruin) {
		if (creep.withdraw(ruin, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
		    creepMovement.moveTo(creep,ruin, { visualizePathStyle: { stroke: '#ffaa00' } });
		}
		return;
	    }

	    let container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
		filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0 && !isNannyReserveContainer(s.pos, creep.room.name)
	    });

	    if (container) {
		if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
		    creepMovement.moveTo(creep,container, { visualizePathStyle: { stroke: '#ffaa00' } });
		}
		return;
	    }

	    // Если нет источников энергии — добываем из источника
	    let source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
	    if (source) {
		if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
		    creepMovement.moveTo(creep,source, { visualizePathStyle: { stroke: '#ffaa00' } });
		}
	    }
	}
    }
};

module.exports = roleBuilder;
