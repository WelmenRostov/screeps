const creepMovement = require('./creepMovement');

let roleBobRemoteHauler = {
    countCreepsGoingToSource: function(sourceId, targetRoom) {
        if (!Memory.remoteHaulers) {
            Memory.remoteHaulers = {};
        }
        if (!Memory.remoteHaulers[targetRoom]) {
            Memory.remoteHaulers[targetRoom] = {};
        }
        
        let cache = Memory.remoteHaulers[targetRoom];
        if (cache.lastTick !== Game.time) {
            cache.counts = {};
            cache.lastTick = Game.time;
            
            for (let name in Game.creeps) {
                let c = Game.creeps[name];
                if (c.memory.role === 'bobRemoteHauler' && c.memory.committedTargetId) {
                    let targetId = c.memory.committedTargetId;
                    cache.counts[targetId] = (cache.counts[targetId] || 0) + 1;
                }
            }
        }
        
        return cache.counts[sourceId] || 0;
    },
    
    run: function(creep) {
        const targetRoom = creep.memory.targetRoom || 'W22N56';
        const homeRoom = creep.memory.homeRoom || (Game.spawns['Bob'] ? Game.spawns['Bob'].room.name : creep.room.name);
        const idlePos = creep.memory.idlePos
            ? new RoomPosition(creep.memory.idlePos.x, creep.memory.idlePos.y, creep.memory.idlePos.roomName || homeRoom)
            : new RoomPosition(28, 48, homeRoom);
        if (!targetRoom || !homeRoom) return;

        const isFull = creep.store.getFreeCapacity() === 0;
        const hasPower = creep.store[RESOURCE_POWER] > 0;
        const hasResources = creep.store.getUsedCapacity() > 0;

        if (!isFull) {
            if (creep.room.name !== targetRoom) {
                creep.memory.committedTargetId = null;
                creepMovement.moveTo(creep, new RoomPosition(25, 25, targetRoom), {
                    reusePath: 15
                });
                return;
            }

            let powerDrop = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, { filter: r => r.resourceType === RESOURCE_POWER });
            if (powerDrop && creep.store.getFreeCapacity(RESOURCE_POWER) > 0) {
                if (creep.pickup(powerDrop) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, powerDrop, { reusePath: 5 });
                }
                return;
            }

            let powerTombstone = creep.pos.findClosestByPath(FIND_TOMBSTONES, { filter: t => t.store && t.store[RESOURCE_POWER] > 0 });
            if (powerTombstone && creep.store.getFreeCapacity(RESOURCE_POWER) > 0) {
                if (creep.withdraw(powerTombstone, RESOURCE_POWER) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, powerTombstone, { reusePath: 5 });
                }
                return;
            }

            let powerRuin = creep.pos.findClosestByPath(FIND_RUINS, { filter: r => r.store && r.store[RESOURCE_POWER] > 0 });
            if (powerRuin && creep.store.getFreeCapacity(RESOURCE_POWER) > 0) {
                if (creep.withdraw(powerRuin, RESOURCE_POWER) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, powerRuin, { reusePath: 5 });
                }
                return;
            }

            let committedTarget = null;
            if (creep.memory.committedTargetId) {
                let target = Game.getObjectById(creep.memory.committedTargetId);
                if (target) {
                    let hasEnergy = false;
                    if (target.structureType === STRUCTURE_CONTAINER || (target.store && !target.structureType)) {
                        hasEnergy = (target.store && target.store[RESOURCE_ENERGY] || 0) > 0;
                    } else if (target.resourceType === RESOURCE_ENERGY) {
                        hasEnergy = target.amount > 0;
                }
                    
                    if (hasEnergy) {
                        committedTarget = target;
                    } else {
                        creep.memory.committedTargetId = null;
                    }
                } else {
                    creep.memory.committedTargetId = null;
                    }
            }

            if (committedTarget) {
                if (committedTarget.structureType === STRUCTURE_CONTAINER || (committedTarget.store && !committedTarget.structureType)) {
                    if (creep.withdraw(committedTarget, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, committedTarget, { reusePath: 5 });
                    }
                } else {
                    if (creep.pickup(committedTarget) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, committedTarget, { reusePath: 5 });
                    }
                    }
                    return;
            }

            let allSources = [];

            let containers = creep.room.find(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_CONTAINER && (s.store[RESOURCE_ENERGY] || 0) > 0
            });
                for (let c of containers) {
                allSources.push({
                    target: c,
                    amount: c.store[RESOURCE_ENERGY] || 0,
                    type: 'container',
                    id: c.id
                });
            }

            let drops = creep.room.find(FIND_DROPPED_RESOURCES, {
                filter: r => r.resourceType === RESOURCE_ENERGY && r.amount > 0
            });
            for (let d of drops) {
                allSources.push({
                    target: d,
                    amount: d.amount,
                    type: 'drop',
                    id: d.id
                });
            }

            let tombstones = creep.room.find(FIND_TOMBSTONES, {
                filter: t => t.store && (t.store[RESOURCE_ENERGY] || 0) > 0
            });
            for (let t of tombstones) {
                allSources.push({
                    target: t,
                    amount: t.store[RESOURCE_ENERGY] || 0,
                    type: 'tombstone',
                    id: t.id
                });
            }

            if (allSources.length > 0) {
                for (let source of allSources) {
                    source.creepsGoing = this.countCreepsGoingToSource(source.id, targetRoom);
                }
                
                allSources.sort((a, b) => {
                    let aScore = a.amount / Math.max(1, a.creepsGoing + 1);
                    let bScore = b.amount / Math.max(1, b.creepsGoing + 1);
                    return bScore - aScore;
                });
                
                let bestSource = allSources[0];
                creep.memory.committedTargetId = bestSource.id;

                if (bestSource.type === 'container' || bestSource.type === 'tombstone') {
                    if (creep.withdraw(bestSource.target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, bestSource.target, { reusePath: 5 });
                    }
                } else if (bestSource.type === 'drop') {
                    if (creep.pickup(bestSource.target) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, bestSource.target, { reusePath: 5 });
                    }
                    }
                    return;
            }

            if (creep.room.name === targetRoom) {
                const waitPos = new RoomPosition(19, 48, targetRoom);
                if (!creep.pos.isEqualTo(waitPos)) {
                    creepMovement.moveTo(creep, waitPos, {
                        reusePath: 10
                    });
                }
                return;
            }

            creepMovement.moveTo(creep, new RoomPosition(25, 25, targetRoom), {
                reusePath: 10
            });
        } else {
            creep.memory.committedTargetId = null;
            
            let storage = null;
            let bobSpawn = Game.spawns['Bob'];
            if (bobSpawn && bobSpawn.room && bobSpawn.room.storage) {
                storage = bobSpawn.room.storage;
            } else if (creep.room.storage) {
                storage = creep.room.storage;
            }

            if (storage) {
                if (creep.room.name !== storage.room.name) {
                    creepMovement.moveTo(creep, storage.pos, {
                        reusePath: 15
                    });
                    return;
                }

                for (let resource in creep.store) {
                    if (creep.store[resource] > 0) {
                        if (creep.transfer(storage, resource) === ERR_NOT_IN_RANGE) {
                            creepMovement.moveTo(creep, storage, { reusePath: 5 });
                        }
                        return;
                    }
                }
            } else {
                if (creep.room.name !== homeRoom) {
                    creepMovement.moveTo(creep, new RoomPosition(25, 25, homeRoom), {
                        reusePath: 15
                    });
                    return;
                }

                let spawn = creep.room.find(FIND_MY_STRUCTURES, {
                    filter: s => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) &&
                        s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                })[0];
                if (spawn && creep.store[RESOURCE_ENERGY] > 0) {
                    if (creep.transfer(spawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, spawn, { reusePath: 5 });
                    }
                    return;
                }

                if (hasResources) {
                    for (let resource in creep.store) {
                        if (creep.store[resource] > 0) {
                            creep.drop(resource);
                            break;
                        }
                    }
                } else {
                    if (!creep.pos.isEqualTo(idlePos)) {
                        creepMovement.moveTo(creep, idlePos, { reusePath: 10 });
                    }
                }
            }
        }
    }
};

module.exports = roleBobRemoteHauler;

