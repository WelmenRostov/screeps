const creepMovement = require('./creepMovement');

let roleDriller = {
    /** @param {Creep} creep **/
    run: function(creep) {
        // Иконка над бурильщиком
        new RoomVisual(creep.room.name).text('⛏️', creep.pos.x, creep.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });

        // Бурильщик всегда добывает и сбрасывает энергию
        if (creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.working = false;
        }

        if (creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
        }

        if (creep.memory.working) {
            // Сбрасываем энергию в контейнер под собой
            let containerUnder = creep.pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_CONTAINER);
            if (containerUnder) {
                if (creep.transfer(containerUnder, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    // Если не можем передать - сбрасываем на землю
                    creep.drop(RESOURCE_ENERGY);
                }
            } else {
                // Если нет контейнера под собой - сбрасываем на землю
                creep.drop(RESOURCE_ENERGY);
            }
        } else {
            // Ищем все источники в комнате
            let sources = creep.room.find(FIND_SOURCES);
            
            if (sources.length === 0) {
                return; // Нет источников
            }

            // Ищем активный источник (с энергией)
            let activeSource = sources.find(s => s.energy > 0);
            
            if (activeSource) {
                // Ищем контейнер рядом с активным источником (в радиусе 1)
                let nearbyContainer = activeSource.pos.findInRange(FIND_STRUCTURES, 1, {
                    filter: (s) => s.structureType === STRUCTURE_CONTAINER
                })[0];

                if (nearbyContainer) {
                    // Есть контейнер рядом - становимся на него
                    if (creep.pos.getRangeTo(nearbyContainer) > 0) {
                        creepMovement.moveTo(creep, nearbyContainer, { 
                            reusePath: 5,
                            visualizePathStyle: { stroke: '#ffaa00' } 
                        });
                    } else {
                        // Стоим на контейнере - добываем
                        if (creep.harvest(activeSource) === ERR_NOT_IN_RANGE) {
                            creepMovement.moveTo(creep, activeSource, { 
                                reusePath: 5,
                                visualizePathStyle: { stroke: '#ffaa00' } 
                            });
                        }
                    }
                } else {
                    // Нет контейнера рядом - идём к источнику
                    if (creep.harvest(activeSource) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, activeSource, { 
                            reusePath: 5,
                            visualizePathStyle: { stroke: '#ffaa00' } 
                        });
                    }
                }
            } else {
                // Все источники пусты - ищем источник, который обновится быстрее всего
                let bestSource = null;
                let minTicksToRegenerate = Infinity;

                for (let source of sources) {
                    let ticksToRegenerate = source.ticksToRegenerate || 0;
                    if (ticksToRegenerate < minTicksToRegenerate) {
                        minTicksToRegenerate = ticksToRegenerate;
                        bestSource = source;
                    }
                }

                if (bestSource) {
                    // Ищем контейнер рядом с лучшим источником
                    let nearbyContainer = bestSource.pos.findInRange(FIND_STRUCTURES, 1, {
                        filter: (s) => s.structureType === STRUCTURE_CONTAINER
                    })[0];

                    if (nearbyContainer) {
                        // Есть контейнер рядом - становимся на него и ждём
                        if (creep.pos.getRangeTo(nearbyContainer) > 0) {
                            creepMovement.moveTo(creep, nearbyContainer, { 
                                reusePath: 10,
                                visualizePathStyle: { stroke: '#ffaa00' } 
                            });
                        }
                        // Если уже на контейнере - ждём
                    } else {
                        // Нет контейнера - идём к источнику
                        if (creep.pos.getRangeTo(bestSource) > 1) {
                            creepMovement.moveTo(creep, bestSource, { 
                                reusePath: 10,
                                visualizePathStyle: { stroke: '#ffaa00' } 
                            });
                        }
                    }
                }
            }
        }
    }
};

module.exports = roleDriller;
