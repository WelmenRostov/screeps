const creepMovement = require('./creepMovement');
const { isNannyReserveContainer } = require('./variables');

let roleBobMover = {
    /** @param {Creep} creep **/
    run: function(creep) {
        let homeRoom = creep.memory.homeRoom || (Game.spawns['Bob'] ? Game.spawns['Bob'].room.name : null);
        if (homeRoom && creep.room.name !== homeRoom) {
            creep.memory.committedTargetId = null;
            creepMovement.moveTo(creep, new RoomPosition(25, 25, homeRoom), {
                reusePath: 20
            });
            return;
        }

        if (creep.store.getUsedCapacity() === 0) {
            creep.memory.working = false;
        }

        if (creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
            creep.memory.committedTargetId = null;
        }

        const reserveContainerPositions = [
            new RoomPosition(26, 23, creep.room.name),
            new RoomPosition(27, 23, creep.room.name),
            new RoomPosition(28, 23, creep.room.name)
        ];

        const isReserveContainer = function(pos) {
            return reserveContainerPositions.some(rp => rp.x === pos.x && rp.y === pos.y);
        };


        if (creep.memory.working) {
            let hasNonEnergy = false;
            for (let resource in creep.store) {
                if (resource !== RESOURCE_ENERGY && creep.store[resource] > 0) {
                    hasNonEnergy = true;
                    break;
                }
            }

            if (hasNonEnergy) {
                let drop = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES);
                if (!drop) {
                    let storage = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                        filter: (s) => s.structureType === STRUCTURE_STORAGE && s.store.getFreeCapacity() > 0
                    });
                    if (storage) {
                        let resourceType = null;
                        for (let resource in creep.store) {
                            if (resource !== RESOURCE_ENERGY && creep.store[resource] > 0) {
                                resourceType = resource;
                                break;
                            }
                        }
                        if (resourceType) {
                            if (creep.transfer(storage, resourceType) === ERR_NOT_IN_RANGE) {
                                creepMovement.moveTo(creep, storage, { 
                                    reusePath: 5, 
                                });
                            }
                            return;
                        }
                    }
                }
            }


            let sources = creep.room.find(FIND_SOURCES);
            let isNearSource = function(pos) {
                for (let source of sources) {
                    if (pos.getRangeTo(source) <= 2) {
                        return true;
                    }
                }
                return false;
            };

            let reserveContainers = reserveContainerPositions.map(rp => {
                return rp.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_CONTAINER);
            }).filter(c => c && c.store.getFreeCapacity(RESOURCE_ENERGY) > 0);

            if (reserveContainers.length > 0 && creep.store[RESOURCE_ENERGY] > 0) {
                let targetContainer = reserveContainers[0];
                if (creep.transfer(targetContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, targetContainer, { 
                        reusePath: 5, 
                    });
                }
                return;
            }

            let container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_CONTAINER && 
                               s.store.getFreeCapacity(RESOURCE_ENERGY) > 0 &&
                               !isNearSource(s.pos) &&
                               !isReserveContainer(s.pos) &&
                               !isNannyReserveContainer(s.pos, creep.room.name)
            });

            if (container && creep.store[RESOURCE_ENERGY] > 0) {
                if (creep.transfer(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, container, { 
                        reusePath: 5, 
                    });
                }
                return;
            }

            let storage = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_STORAGE && s.store.getFreeCapacity() > 0
            });

            if (storage) {
                let resourceType = null;
                for (let resource in creep.store) {
                    if (creep.store[resource] > 0) {
                        resourceType = resource;
                        break;
                    }
                }
                if (resourceType) {
                    if (creep.transfer(storage, resourceType) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, storage, { 
                            reusePath: 5
                        });
                    }
                }
            } else {
                for (let resource in creep.store) {
                    if (creep.store[resource] > 0) {
                        creep.drop(resource);
                        break;
                    }
                }
            }
        } else {
            const structuresHere = creep.pos.lookFor(LOOK_STRUCTURES);
            const containerHere = structuresHere.find(s => s.structureType === STRUCTURE_CONTAINER && s.store && s.store.getUsedCapacity() > 0 && !isNannyReserveContainer(s.pos, creep.room.name));
            const dropsHere = creep.pos.lookFor(LOOK_RESOURCES);
            if (containerHere && dropsHere.length > 0) {
                let resourceType = null;
                for (let res in containerHere.store) {
                    if (containerHere.store[res] > 0) {
                        resourceType = res;
                        break;
                    }
                }
                if (resourceType) {
                    if (creep.withdraw(containerHere, resourceType) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, containerHere, { reusePath: 3 });
                    }
                    return;
                }
            }

            let committedTarget = null;
            if (creep.memory.committedTargetId) {
                let target = Game.getObjectById(creep.memory.committedTargetId);
                if (target) {
                    let hasEnergy = false;
                    if (target.structureType === STRUCTURE_CONTAINER || (target.store && !target.structureType)) {
                        hasEnergy = (target.store && target.store[RESOURCE_ENERGY] || 0) > 0;
                        if (hasEnergy && target.structureType === STRUCTURE_CONTAINER && isNannyReserveContainer(target.pos, creep.room.name)) {
                            hasEnergy = false;
                            creep.memory.committedTargetId = null;
                        }
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

            let nearDrop = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1, {
                filter: r => {
                    if (r.amount <= 0 || r.resourceType !== RESOURCE_ENERGY) return false;
                    let structs = r.pos.lookFor(LOOK_STRUCTURES);
                    return !structs.some(s => s.structureType === STRUCTURE_CONTAINER && s.store);
                }
            })[0];
            if (nearDrop) {
                creep.memory.committedTargetId = nearDrop.id;
                if (creep.pickup(nearDrop) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, nearDrop, { reusePath: 3 });
                }
                return;
            }

            let allSources = [];
            
            let drops = creep.room.find(FIND_DROPPED_RESOURCES, {
                filter: r => {
                    if (r.amount <= 0 || r.resourceType !== RESOURCE_ENERGY) return false;
                    let structs = r.pos.lookFor(LOOK_STRUCTURES);
                    return !structs.some(s => s.structureType === STRUCTURE_CONTAINER && s.store);
                }
            });
            for (let d of drops) {
                allSources.push({
                    target: d,
                    amount: d.amount,
                    type: 'drop',
                    id: d.id
                });
            }

            let containers = creep.room.find(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_CONTAINER && 
                    (s.store[RESOURCE_ENERGY] || 0) > 0 &&
                    !isReserveContainer(s.pos) &&
                    !isNannyReserveContainer(s.pos, creep.room.name)
            });
            for (let c of containers) {
                if (!isNannyReserveContainer(c.pos, creep.room.name)) {
                    allSources.push({
                        target: c,
                        amount: c.store[RESOURCE_ENERGY] || 0,
                        type: 'container',
                        id: c.id
                    });
                }
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
                    source.creepsGoing = creepMovement.countCreepsGoingToSource(source.id, creep.room.name, 'bobMover');
                }
                
                allSources.sort((a, b) => {
                    let aScore = a.amount / Math.max(1, a.creepsGoing + 1);
                    let bScore = b.amount / Math.max(1, b.creepsGoing + 1);
                    return bScore - aScore;
                });
                
                let bestSource = allSources[0];
                if (bestSource && bestSource.type === 'container' && isNannyReserveContainer(bestSource.target.pos, creep.room.name)) {
                    allSources = allSources.filter(s => !(s.type === 'container' && isNannyReserveContainer(s.target.pos, creep.room.name)));
                    if (allSources.length > 0) {
                        bestSource = allSources[0];
                    } else {
                        bestSource = null;
                    }
                }
                
                if (bestSource) {
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
            }

            let drop = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
                filter: r => {
                    if (r.amount <= 0 || r.resourceType !== RESOURCE_ENERGY) return false;
                    let structs = r.pos.lookFor(LOOK_STRUCTURES);
                    return !structs.some(s => s.structureType === STRUCTURE_CONTAINER && s.store);
                }
            });

            if (drop) {
                creep.memory.committedTargetId = drop.id;
                if (creep.pickup(drop) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, drop, { reusePath: 5 });
                }
                return;
            }

            let hasNonEnergy = false;
            for (let resource in creep.store) {
                if (resource !== RESOURCE_ENERGY && creep.store[resource] > 0) {
                    hasNonEnergy = true;
                    break;
                }
            }

            if (hasNonEnergy) {
                let storage = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: (s) => s.structureType === STRUCTURE_STORAGE && s.store.getFreeCapacity() > 0
                });
                if (storage) {
                    let resourceType = null;
                    for (let resource in creep.store) {
                        if (resource !== RESOURCE_ENERGY && creep.store[resource] > 0) {
                            resourceType = resource;
                            break;
                        }
                    }
                    if (resourceType) {
                        if (creep.transfer(storage, resourceType) === ERR_NOT_IN_RANGE) {
                            creepMovement.moveTo(creep, storage, { 
                                reusePath: 5, 
                            });
                        }
                        return;
                    }
                }
            }

            let tombstone = creep.pos.findClosestByPath(FIND_TOMBSTONES, {
                filter: (t) => t.store && Object.keys(t.store).length > 0
            });
            if (tombstone) {
                let resourceType = null;
                for (let resource in tombstone.store) {
                    if (tombstone.store[resource] > 0) {
                        resourceType = resource;
                        break;
                    }
                }
                if (resourceType) {
                    if (creep.withdraw(tombstone, resourceType) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, tombstone, { reusePath: 5 });
                    }
                }
                return;
            }

            let ruin = creep.pos.findClosestByPath(FIND_RUINS, {
                filter: (r) => r.store && Object.keys(r.store).length > 0
            });
            if (ruin) {
                let resourceType = null;
                for (let resource in ruin.store) {
                    if (ruin.store[resource] > 0) {
                        resourceType = resource;
                        break;
                    }
                }
                if (resourceType) {
                    if (creep.withdraw(ruin, resourceType) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, ruin, { reusePath: 5 });
                    }
                }
                return;
            }

            let link = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_LINK && s.store[RESOURCE_ENERGY] > 0
            });
            if (link) {
                if (creep.withdraw(link, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, link, { reusePath: 5 });
                }
                return;
            }


            let allContainers = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_CONTAINER && 
                               Object.keys(s.store).length > 0 &&
                               !isReserveContainer(s.pos) &&
                               !isNannyReserveContainer(s.pos, creep.room.name)
            });

            if (allContainers.length > 0) {
                let containerScores = [];
                for (let container of allContainers) {
                    let totalEnergy = 0;
                    for (let resource in container.store) {
                        totalEnergy += container.store[resource];
                    }

                    let nearbyMovers = creep.room.find(FIND_MY_CREEPS, {
                        filter: c => c.memory.role === 'bobMover' && 
                                     c !== creep && 
                                     c.pos.getRangeTo(container) <= 2
                    });

                    let distance = creep.pos.getRangeTo(container);
                    let score = totalEnergy / (distance + 1) / (nearbyMovers.length + 1);

                    containerScores.push({
                        container: container,
                        score: score,
                        energy: totalEnergy,
                        distance: distance,
                        nearbyMovers: nearbyMovers.length
                    });
                }

                containerScores.sort((a, b) => b.score - a.score);

                if (containerScores.length > 0) {
                    let bestContainer = containerScores[0].container;
                    let resourceType = null;
                    for (let resource in bestContainer.store) {
                        if (bestContainer.store[resource] > 0) {
                            resourceType = resource;
                            break;
                        }
                    }
                    if (resourceType) {
                        if (creep.withdraw(bestContainer, resourceType) === ERR_NOT_IN_RANGE) {
                            creepMovement.moveTo(creep, bestContainer, { reusePath: 5 });
                        }
                    }
                    return;
                }
            }

            let storageSource = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] > 0
            });
            if (storageSource) {
                if (creep.withdraw(storageSource, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, storageSource, { reusePath: 5 });
                }
                return;
            }
        }
    }
};

module.exports = roleBobMover;
