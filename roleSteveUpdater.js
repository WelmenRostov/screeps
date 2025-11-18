const creepMovement = require('./creepMovement');

let roleSteveUpdater = {
    /** @param {Creep} creep **/
    run: function(creep) {
        new RoomVisual(creep.room.name).text('🌾', creep.pos.x, creep.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });

        if (creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
        }

        if (creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.working = false;
        }

        if (creep.memory.working) {
            let controller = creep.room.controller;
            if (controller) {
                let result = creep.upgradeController(controller);
                if (result === ERR_NOT_IN_RANGE || creep.pos.getRangeTo(controller) > 1) {
                    creepMovement.moveTo(creep, controller, {
                        range: 1,
                        reusePath: 5,
                        visualizePathStyle: { stroke: '#ffff00' }
                    });
                }
            }
        } else {
            let storage = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_STORAGE &&
                    s.store &&
                    s.store[RESOURCE_ENERGY] > 0
            });

            if (storage) {
                if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, storage, {
                        reusePath: 5,
                        visualizePathStyle: { stroke: '#ffaa00' }
                    });
                }
                return;
            }

            let container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_CONTAINER &&
                    s.store &&
                    s.store[RESOURCE_ENERGY] > 0
            });

            if (container) {
                if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, container, {
                        reusePath: 5,
                        visualizePathStyle: { stroke: '#ffaa00' }
                    });
                }
                return;
            }

            let drop = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
                filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount > 0
            });

            if (drop) {
                if (creep.pickup(drop) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, drop, {
                        reusePath: 5,
                        visualizePathStyle: { stroke: '#ffaa00' }
                    });
                }
                return;
            }
        }
    }
};

module.exports = roleSteveUpdater;
