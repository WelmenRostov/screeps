const creepMovement = require('./creepMovement');

let roleMammyRemoteHauler = {
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
                if (c.memory.role === 'mammyRemoteHauler' && c.memory.committedTargetId) {
                    let targetId = c.memory.committedTargetId;
                    cache.counts[targetId] = (cache.counts[targetId] || 0) + 1;
                }
            }
        }
        
        return cache.counts[sourceId] || 0;
    },
    
    run: function(creep) {
        const targetRoom = creep.memory.targetRoom || 'W24N56';
        const homeRoom = creep.memory.homeRoom || (Game.spawns['Mammy'] ? Game.spawns['Mammy'].room.name : creep.room.name);
        if (!targetRoom || !homeRoom) return;

        const isFull = creep.store.getFreeCapacity() === 0;
        const hasResources = creep.store.getUsedCapacity() > 0;

        if (!isFull) {
            if (creep.room.name !== targetRoom) {
                creep.memory.committedTargetId = null;
                creepMovement.moveTo(creep, new RoomPosition(25, 25, targetRoom), {
                    reusePath: 15
                });
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
                filter: s => s.structureType === STRUCTURE_CONTAINER && s.store && (s.store[RESOURCE_ENERGY] || 0) > 0
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

            creepMovement.moveTo(creep, new RoomPosition(25, 25, targetRoom), {
                reusePath: 10
            });
        } else if (hasResources) {
            creep.memory.committedTargetId = null;
            
            if (creep.room.name !== homeRoom) {
                creepMovement.moveTo(creep, new RoomPosition(25, 25, homeRoom), {
                    reusePath: 15
                });
                return;
            }

            let storage = creep.room.find(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_STORAGE
            })[0];

            if (storage) {
                for (let resourceType in creep.store) {
                    if (creep.transfer(storage, resourceType) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, storage, {
                            reusePath: 5
                        });
                        return;
                    }
                }
            } else {
                creepMovement.moveTo(creep, new RoomPosition(25, 25, homeRoom), {
                    reusePath: 10
                });
            }
        }
    }
};

module.exports = roleMammyRemoteHauler;
