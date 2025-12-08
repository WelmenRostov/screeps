const creepMovement = require('./creepMovement');

let roleMammyNanny = {
    run: function(creep) {
        const homeRoom = creep.memory.homeRoom || (Game.spawns['Mammy'] ? Game.spawns['Mammy'].room.name : creep.room.name);
        
        if (homeRoom && creep.room.name !== homeRoom) {
            creepMovement.moveTo(creep, new RoomPosition(20, 21, homeRoom), {
                reusePath: 10
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
            let spawn = Game.spawns['Mammy'];
            if (spawn && spawn.energy < spawn.energyCapacity) {
                if (creep.transfer(spawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, spawn, {
                        reusePath: 5
                    });
                }
            } else {
                let extensions = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType === STRUCTURE_EXTENSION && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                });
                
                if (extensions.length > 0) {
                    let target = creep.pos.findClosestByPath(extensions);
                    if (target) {
                        let result = creep.transfer(target, RESOURCE_ENERGY);
                        if (result === ERR_NOT_IN_RANGE) {
                            creepMovement.moveTo(creep, target, {
                                reusePath: 5
                            });
                        }
                        return;
                    }
                }
                
                let towers = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType === STRUCTURE_TOWER && s.energy < s.energyCapacity * 0.5
                });
                if (towers.length > 0) {
                    let target = creep.pos.findClosestByPath(towers);
                    if (target) {
                        if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                            creepMovement.moveTo(creep, target, {
                                reusePath: 5
                            });
                        }
                    }
                } else {
                    creepMovement.moveTo(creep, new RoomPosition(20, 21, homeRoom), {
                        reusePath: 10
                    });
                }
            }
        } else {
            let storage = creep.room.find(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_STORAGE && s.store && s.store[RESOURCE_ENERGY] > 0
            })[0];

            if (storage) {
                if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, storage, {
                        reusePath: 5
                    });
                }
            } else {
                creepMovement.moveTo(creep, new RoomPosition(20, 21, homeRoom), {
                    reusePath: 10
                });
            }
        }
    }
};

module.exports = roleMammyNanny;

