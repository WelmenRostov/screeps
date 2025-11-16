const creepMovement = require('./creepMovement');

let roleBobInvader = {
    /** @param {Creep} creep **/
    run: function(creep) {
        new RoomVisual(creep.room.name).text('🏗️', creep.pos.x, creep.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });

        const targetRoom = creep.memory.targetRoom || 'W22N56';
        const homeRoom = creep.memory.homeRoom || creep.room.name;

        if (creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.working = false;
            delete creep.memory.repairTarget;
        }

        if (creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
        }

        if (creep.memory.working) {
            if (creep.room.name !== targetRoom) {
                creepMovement.moveTo(creep, new RoomPosition(25, 25, targetRoom), {
                    reusePath: 10,
                    visualizePathStyle: { stroke: '#ff0000' }
                });
                return;
            }

            if (creep.memory.repairTarget) {
                let targetStruct = Game.getObjectById(creep.memory.repairTarget);
                if (!targetStruct || targetStruct.hits >= targetStruct.hitsMax) {
                    delete creep.memory.repairTarget;
                } else {
                    if (creep.repair(targetStruct) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, targetStruct, {
                            reusePath: 5,
                            visualizePathStyle: { stroke: '#ffff00' }
                        });
                    }
                    return;
                }
            }

            let damagedRoad = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_ROAD && s.hits < s.hitsMax * 0.5
            });
            if (damagedRoad.length > 0) {
                let closest = creep.pos.findClosestByPath(damagedRoad);
                if (closest) {
                    creep.memory.repairTarget = closest.id;
                    if (creep.repair(closest) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, closest, {
                            reusePath: 5,
                            visualizePathStyle: { stroke: '#ffff00' }
                        });
                    }
                    return;
                }
            }

            let damagedStructure = creep.room.find(FIND_MY_STRUCTURES, {
                filter: (s) => s.hits < s.hitsMax &&
                    s.structureType !== STRUCTURE_WALL &&
                    s.structureType !== STRUCTURE_RAMPART &&
                    s.structureType !== STRUCTURE_ROAD
            });
            if (damagedStructure.length > 0) {
                let closest = creep.pos.findClosestByPath(damagedStructure);
                if (closest) {
                    if (creep.repair(closest) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, closest, {
                            reusePath: 5,
                            visualizePathStyle: { stroke: '#ff0000' }
                        });
                    }
                    return;
                }
            }

            let constructionSite = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
            if (constructionSite) {
                if (creep.build(constructionSite) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, constructionSite, {
                        reusePath: 5,
                        visualizePathStyle: { stroke: '#00ff00' }
                    });
                }
                return;
            }

            let weakWall = creep.room.find(FIND_MY_STRUCTURES, {
                filter: (s) => (s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART) && s.hits < s.hitsMax
            });
            if (weakWall.length > 0) {
                let closest = creep.pos.findClosestByPath(weakWall);
                if (closest) {
                    if (creep.repair(closest) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, closest, {
                            reusePath: 5,
                            visualizePathStyle: { stroke: '#ff8800' }
                        });
                    }
                    return;
                }
            }

            let fallbackRepair = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.hits < s.hitsMax
            });

            if (fallbackRepair) {
                if (creep.repair(fallbackRepair) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, fallbackRepair, {
                        reusePath: 5,
                        visualizePathStyle: { stroke: '#00ffff' }
                    });
                }
                return;
            }

            creepMovement.moveTo(creep, new RoomPosition(25, 25, targetRoom), {
                reusePath: 10,
                visualizePathStyle: { stroke: '#ffffff' }
            });
        } else {
            if (creep.room.name === targetRoom) {
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

            if (creep.room.name === homeRoom) {
                let storage = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: (s) => s.structureType === STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] > 0
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
                    filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
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
            }

            if (creep.room.name !== homeRoom) {
                creepMovement.moveTo(creep, new RoomPosition(25, 25, homeRoom), {
                    reusePath: 15,
                    visualizePathStyle: { stroke: '#ffaa00' }
                });
                return;
            }

            let source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
            if (source) {
                if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, source, {
                        reusePath: 10,
                        visualizePathStyle: { stroke: '#ffaa00' }
                    });
                }
            }
        }
    }
};

module.exports = roleBobInvader;

