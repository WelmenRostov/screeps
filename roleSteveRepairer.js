const creepMovement = require('./creepMovement');

let roleSteveRepairer = {
    /** @param {Creep} creep **/
    run: function(creep) {
        new RoomVisual(creep.room.name).text('🔨', creep.pos.x, creep.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });

        if (creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.working = false;
        }

        if (creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
        }

        if (creep.memory.working) {
            let priorityRampartPos = new RoomPosition(37, 34, creep.room.name);
            let priorityRampart = priorityRampartPos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_RAMPART);
            
            if (priorityRampart && priorityRampart.hits < 4000000) {
                if (creep.repair(priorityRampart) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, priorityRampart, { visualizePathStyle: { stroke: '#ff8800' } });
                }
                return;
            }

            let priorityRampartSite = priorityRampartPos.lookFor(LOOK_CONSTRUCTION_SITES).find(s => s.structureType === STRUCTURE_RAMPART);
            if (priorityRampartSite) {
                if (creep.build(priorityRampartSite) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, priorityRampartSite, { visualizePathStyle: { stroke: '#00ff00' } });
                }
                return;
            }

            let constructionSite = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
                filter: (s) => s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART
            });
            if (constructionSite) {
                if (creep.build(constructionSite) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, constructionSite, { visualizePathStyle: { stroke: '#00ff00' } });
                }
                return;
            }

            let rampartSite = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
                filter: (s) => s.structureType === STRUCTURE_RAMPART
            });
            if (rampartSite) {
                if (creep.build(rampartSite) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, rampartSite, { visualizePathStyle: { stroke: '#00ff00' } });
                }
                return;
            }

            let wallSite = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
                filter: (s) => s.structureType === STRUCTURE_WALL
            });
            if (wallSite) {
                if (creep.build(wallSite) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, wallSite, { visualizePathStyle: { stroke: '#00ff00' } });
                }
                return;
            }

            let weakRampart = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_RAMPART && s.hits < 4000000
            });
            if (weakRampart) {
                if (creep.repair(weakRampart) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, weakRampart, { visualizePathStyle: { stroke: '#ff8800' } });
                }
                return;
            }

            let weakWall = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_WALL && s.hits < 4000000
            });
            if (weakWall) {
                if (creep.repair(weakWall) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, weakWall, { visualizePathStyle: { stroke: '#ff8800' } });
                }
                return;
            }

            let damagedRoad = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_ROAD && s.hits < s.hitsMax
            });
            if (damagedRoad) {
                if (creep.repair(damagedRoad) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, damagedRoad, { visualizePathStyle: { stroke: '#ffff00' } });
                }
                return;
            }
        } else {
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
    }
};

module.exports = roleSteveRepairer;
