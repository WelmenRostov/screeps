const creepMovement = require('./creepMovement');

let roleBobNanny = {
    run: function(creep) {
        new RoomVisual(creep.room.name).text('👶', creep.pos.x, creep.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });

        const homeRoom = creep.memory.homeRoom || (Game.spawns['Bob'] ? Game.spawns['Bob'].room.name : creep.room.name);
        
        if (homeRoom && creep.room.name !== homeRoom) {
            creepMovement.moveTo(creep, new RoomPosition(25, 25, homeRoom), {
                reusePath: 10,
                visualizePathStyle: { stroke: '#ff0000' }
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
                        visualizePathStyle: { stroke: '#00ff00' }
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
                                visualizePathStyle: { stroke: '#ff00ff' }
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
                                visualizePathStyle: { stroke: '#00ffff' }
                            });
                        }
                    }
                } else {
                    // Если все заполнено, ждем в центре комнаты
                    creepMovement.moveTo(creep, new RoomPosition(25, 25, homeRoom), {
                        reusePath: 10,
                        visualizePathStyle: { stroke: '#ffffff' }
                    });
                }
            }
        } else {
            // Берем энергию из сторгейта
            let storage = creep.room.find(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_STORAGE && s.store && s.store[RESOURCE_ENERGY] > 0
            })[0];

            if (storage) {
                if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, storage, {
                        reusePath: 5,
                        visualizePathStyle: { stroke: '#ffaa00' }
                    });
                }
            } else {
                // Если нет сторгейта, ждем в центре комнаты
                creepMovement.moveTo(creep, new RoomPosition(25, 25, homeRoom), {
                    reusePath: 10,
                    visualizePathStyle: { stroke: '#ffffff' }
                });
            }
        }
    }
};

module.exports = roleBobNanny;
