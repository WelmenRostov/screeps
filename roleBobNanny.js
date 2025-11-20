const creepMovement = require('./creepMovement');
const { isNannyReserveContainer } = require('./variables');

let roleBobNanny = {
    run: function(creep) {

        const homeRoom = creep.memory.homeRoom || (Game.spawns['Bob'] ? Game.spawns['Bob'].room.name : creep.room.name);
        
        if (homeRoom && creep.room.name !== homeRoom) {
            creepMovement.moveTo(creep, new RoomPosition(25, 25, homeRoom), {
                reusePath: 10,
            });
            return;
        }

        if (creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.working = false;
        }

        if (creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
        }

        if (creep.memory.working) {
            // 1. Заполняем спавн
            let spawn = Game.spawns['Bob'];
            if (spawn && spawn.energy < spawn.energyCapacity) {
                if (creep.transfer(spawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, spawn, {
                        reusePath: 5,
                    });
                }
            } else {
                // 2. Заполняем экстеншены
                let extensions = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType === STRUCTURE_EXTENSION && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                });
                
                if (extensions.length > 0) {
                    let target = creep.pos.findClosestByPath(extensions);
                    if (target) {
                        let result = creep.transfer(target, RESOURCE_ENERGY);
                        if (result === ERR_NOT_IN_RANGE) {
                            creepMovement.moveTo(creep, target, {
                                reusePath: 5,
                            });
                        } else if (result === OK || result === ERR_FULL) {
                            // Успешно заполнили или уже полон - ничего не делаем, переходим к следующему тику
                        }
                        return; // Выходим, чтобы не переходить к турелям
                    }
                }
                
                // 3. Заполняем турели, если энергии меньше 50% (только если экстеншены заполнены или их нет)
                let towers = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType === STRUCTURE_TOWER && s.energy < s.energyCapacity * 0.5
                });
                if (towers.length > 0) {
                    let target = creep.pos.findClosestByPath(towers);
                    if (target) {
                        if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                            creepMovement.moveTo(creep, target, {
                                reusePath: 5,
                            });
                        }
                    }
                } else {
                    let spawn = Game.spawns['Bob'];
                    if (spawn && spawn.memory.rejuvenationMode && creep.ticksToLive < 1400 && spawn.energy > 0) {
                        if (creep.pos.getRangeTo(spawn) > 1) {
                            creepMovement.moveTo(creep, spawn, {
                                reusePath: 5,
                                range: 1
                            });
                        } else {
                            if (spawn.energy > 0 && creep.ticksToLive < 1400) {
                                spawn.renewCreep(creep);
                            }
                        }
                    } else {
                        creepMovement.moveTo(creep, new RoomPosition(25, 25, homeRoom), {
                            reusePath: 10,
                        });
                    }
                }
            }
        } else {
            const nannyReservePositions = [
                { x: 26, y: 23 },
                { x: 27, y: 23 },
                { x: 28, y: 23 }
            ];
            
            let reserveContainerPositions = nannyReservePositions.map(rp => new RoomPosition(rp.x, rp.y, homeRoom));

            let storage = creep.room.find(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_STORAGE && s.store && s.store[RESOURCE_ENERGY] > 0
            })[0];

            if (storage) {
                if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, storage, {
                        reusePath: 5,
                    });
                }
            } else {
                let reserveContainers = reserveContainerPositions.map(rp => {
                    return rp.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_CONTAINER && s.store && s.store[RESOURCE_ENERGY] > 0);
                }).filter(c => c);

                if (reserveContainers.length > 0) {
                    let targetContainer = reserveContainers[0];
                    if (creep.withdraw(targetContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, targetContainer, {
                            reusePath: 5,
                        });
                    }
                } else {
                    creepMovement.moveTo(creep, new RoomPosition(25, 25, homeRoom), {
                        reusePath: 10,
                    });
                }
            }
        }
    }
};

module.exports = roleBobNanny;
