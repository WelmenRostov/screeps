const creepMovement = require('./creepMovement');

let roleSteveMover = {
    /** @param {Creep} creep **/
    run: function(creep) {
        new RoomVisual(creep.room.name).text('🚚', creep.pos.x, creep.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });

        if (creep.store.getUsedCapacity() === 0) {
            creep.memory.working = false;
        }

        if (creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
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
                                    visualizePathStyle: { stroke: '#00ff00' }
                                });
                            }
                            return;
                        }
                    }
                }
            }

            let spawn = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_SPAWN && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });

            if (spawn && creep.store[RESOURCE_ENERGY] > 0) {
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

            if (tower && creep.store[RESOURCE_ENERGY] > 0) {
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

            if (extension && creep.store[RESOURCE_ENERGY] > 0) {
                if (creep.transfer(extension, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, extension, {
                        reusePath: 5,
                        visualizePathStyle: { stroke: '#ffffff' }
                    });
                }
                return;
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
                        visualizePathStyle: { stroke: '#00ff00' }
                    });
                }
                return;
            }

            let container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_CONTAINER &&
                    s.store.getFreeCapacity(RESOURCE_ENERGY) > 0 &&
                    !isNearSource(s.pos) &&
                    !isReserveContainer(s.pos)
            });

            if (container && creep.store[RESOURCE_ENERGY] > 0) {
                if (creep.transfer(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, container, {
                        reusePath: 5,
                        visualizePathStyle: { stroke: '#00ff00' }
                    });
                }
                return;
            }

            let storage = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_STORAGE &&
                    s.store.getFreeCapacity() > 0 &&
                    !isNearSource(s.pos)
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
                            reusePath: 5,
                            visualizePathStyle: { stroke: '#00ff00' }
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
            const containerHere = structuresHere.find(s => s.structureType === STRUCTURE_CONTAINER && s.store && s.store.getUsedCapacity() > 0);
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
                        creepMovement.moveTo(creep, containerHere, { reusePath: 3, visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                    return;
                }
            }

            let nearDrop = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1, {
                filter: r => {
                    if (r.amount <= 0) return false;
                    let structs = r.pos.lookFor(LOOK_STRUCTURES);
                    return !structs.some(s => s.structureType === STRUCTURE_CONTAINER && s.store);
                }
            })[0];
            if (nearDrop) {
                if (creep.pickup(nearDrop) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, nearDrop, { reusePath: 3, visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }

            let drop = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
                filter: r => {
                    if (r.amount <= 0) return false;
                    let structs = r.pos.lookFor(LOOK_STRUCTURES);
                    return !structs.some(s => s.structureType === STRUCTURE_CONTAINER && s.store);
                }
            });

            if (drop) {
                if (creep.pickup(drop) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, drop, { reusePath: 5, visualizePathStyle: { stroke: '#ffaa00' } });
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
                                visualizePathStyle: { stroke: '#00ff00' }
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
                        creepMovement.moveTo(creep, tombstone, { reusePath: 5, visualizePathStyle: { stroke: '#ffaa00' } });
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
                        creepMovement.moveTo(creep, ruin, { reusePath: 5, visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                }
                return;
            }

            let link = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_LINK && s.store[RESOURCE_ENERGY] > 0
            });
            if (link) {
                if (creep.withdraw(link, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, link, { reusePath: 5, visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }

            let needsEnergy = false;
            let emptySpawn = creep.room.find(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_SPAWN && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            }).length > 0;
            let emptyExtension = creep.room.find(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_EXTENSION && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            }).length > 0;
            let lowTower = creep.room.find(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_TOWER && s.store[RESOURCE_ENERGY] < s.store.getCapacity(RESOURCE_ENERGY) * 0.1
            }).length > 0;

            if (emptySpawn || emptyExtension || lowTower) {
                needsEnergy = true;
            }

            let allContainers = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_CONTAINER &&
                    Object.keys(s.store).length > 0 &&
                    !isReserveContainer(s.pos)
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
                            creepMovement.moveTo(creep, bestContainer, { reusePath: 5, visualizePathStyle: { stroke: '#ffaa00' } });
                        }
                    }
                    return;
                }
            }

            if (needsEnergy) {
                let reserveContainers = reserveContainerPositions.map(rp => {
                    return rp.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0);
                }).filter(c => c);

                if (reserveContainers.length > 0) {
                    let targetContainer = reserveContainers[0];
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
            }
        }
    }
};

module.exports = roleSteveMover;

