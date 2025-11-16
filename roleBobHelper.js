const creepMovement = require('./creepMovement');

let roleBobHelper = {
    run: function(creep) {
        new RoomVisual(creep.room.name).text('🚚', creep.pos.x, creep.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });

        let mammyRoom = Game.spawns['Mammy'] ? Game.spawns['Mammy'].room.name : null;
        let bobRoom = Game.spawns['Bob'] ? Game.spawns['Bob'].room.name : null;

        if (!mammyRoom || !bobRoom) {
            return;
        }

        if (creep.room.name === bobRoom && mammyRoom !== bobRoom) {
            let targetPos = new RoomPosition(25, 25, mammyRoom);
            creepMovement.moveTo(creep, targetPos, { reusePath: 20, visualizePathStyle: { stroke: '#00ffff' } });
            return;
        }

        if (creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.working = false;
        }

        if (creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
        }

        if (creep.memory.working) {
            let spawn = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_SPAWN && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });

            if (spawn) {
                if (creep.transfer(spawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, spawn, { 
                        reusePath: 5, 
                        visualizePathStyle: { stroke: '#ffffff' } 
                    });
                }
                return;
            }

            let tower = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_TOWER && s.store[RESOURCE_ENERGY] < s.store.getCapacity(RESOURCE_ENERGY) * 0.5
            });

            if (tower) {
                if (creep.transfer(tower, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, tower, { 
                        reusePath: 5, 
                        visualizePathStyle: { stroke: '#ffff00' } 
                    });
                }
                return;
            }

            let extension = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_EXTENSION && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });

            if (extension) {
                if (creep.transfer(extension, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, extension, { 
                        reusePath: 5, 
                        visualizePathStyle: { stroke: '#ffffff' } 
                    });
                }
                return;
            }

            let storage = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_STORAGE && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });

            if (storage) {
                if (creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, storage, { 
                        reusePath: 5, 
                        visualizePathStyle: { stroke: '#00ff00' } 
                    });
                }
            } else {
                creep.drop(RESOURCE_ENERGY);
            }
        } else {
            let drop = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
                filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount > 0
            });

            if (drop) {
                if (creep.pickup(drop) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, drop, { reusePath: 5, visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }

            let linkPos = new RoomPosition(21, 18, creep.room.name);
            let linkStruct = linkPos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_LINK && s.store[RESOURCE_ENERGY] > 0);
            if (linkStruct) {
                if (creep.withdraw(linkStruct, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, linkStruct, { reusePath: 5, visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }

            let targetContainers = [
                new RoomPosition(24, 20, creep.room.name),
                new RoomPosition(25, 18, creep.room.name)
            ];
            let targetContainer = null;
            for (let pos of targetContainers) {
                let container = pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0);
                if (container) { targetContainer = container; break; }
            }
            if (targetContainer) {
                if (creep.withdraw(targetContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, targetContainer, { reusePath: 5, visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }

            let storageSource = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] > 0
            });
            if (storageSource) {
                if (creep.withdraw(storageSource, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, storageSource, { reusePath: 5, visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }

            creepMovement.moveTo(creep, new RoomPosition(25, 25, creep.room.name), { reusePath: 10, visualizePathStyle: { stroke: '#00ff00' } });
        }
    }
};

module.exports = roleBobHelper;

