const creepMovement = require('./creepMovement');

let roleСourtier = {
    /** @param {Creep} creep **/
    run: function(creep) {
    // Иконка над придворным: строго над крипом, без шлейфа
    new RoomVisual(creep.room.name).text('🩺', creep.pos.x, creep.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });
	if (creep.store[RESOURCE_ENERGY] === 0) {
	    creep.memory.working = false;
	}

	if (creep.store.getFreeCapacity() === 0) {
	    creep.memory.working = true;
	}

	if (creep.memory.working) {
	    // 1) Если Мама (спавн/экстеншены) не полна — заправляем
	    let energySink = creep.pos.findClosestByPath(FIND_STRUCTURES, {
		filter: (s) => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION)
		    && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
	    });
	    if (energySink) {
		if (creep.transfer(energySink, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
		    creepMovement.moveTo(creep,energySink, { visualizePathStyle: { stroke: '#ffffff' } });
		}
		return;
	    }

	    // 2) Если Мама полная — строим
	    let constructionSite = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
	    if (constructionSite) {
		if (creep.build(constructionSite) === ERR_NOT_IN_RANGE) {
		    creepMovement.moveTo(creep,constructionSite, { visualizePathStyle: { stroke: '#00ff00' } });
		}
		return;
	    }

	    // 3) Если строить нечего — несем энергию в любой свободный контейнер
	    let container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
		filter: (structure) => structure.structureType === STRUCTURE_CONTAINER &&
		    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
	    });
	    if (container) {
		if (creep.transfer(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
		    creepMovement.moveTo(creep,container, { visualizePathStyle: { stroke: '#ffffff' } });
		}
	    }
	} else {
	    // Пополняем запас: сперва источники, затем руины
	    let source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
	    if (source) {
		if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
		    creepMovement.moveTo(creep,source, { visualizePathStyle: { stroke: '#ffaa00' } });
		}
	    } else {
		// Если источники пусты — собираем из руин
		let ruin = creep.pos.findClosestByPath(FIND_RUINS, {
		    filter: (r) => r.store[RESOURCE_ENERGY] > 0
		});

		if (ruin) {
		    if (creep.withdraw(ruin, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
			creep.moveTo(ruin, { visualizePathStyle: { stroke: '#ffaa00' } });
		    }
		}
	    }
	}
    }
};

module.exports = roleСourtier;


