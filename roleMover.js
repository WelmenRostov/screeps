const creepMovement = require('./creepMovement');

let roleMover = {
    /** @param {Creep} creep **/
    run: function(creep) {
        // Мувер собирает энергию с земли и отвозит в контейнеры
        if (creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.working = false;
        }

        if (creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
            creep.memory.committedTargetId = null;
        }

        if (creep.memory.working) {
            // 1) Отвозим энергию в спавн (приоритет)
            let spawn = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_SPAWN && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });

            if (spawn) {
                if (creep.transfer(spawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, spawn, {
                        reusePath: 5
                    });
                }
                return;
            }

            // 2) Отвозим энергию в турели (если заряд меньше 50%)
            let tower = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_TOWER && s.store[RESOURCE_ENERGY] < s.store.getCapacity(RESOURCE_ENERGY) * 0.5
            });

            if (tower) {
                if (creep.transfer(tower, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, tower, {
                        reusePath: 5
                    });
                }
                return;
            }

            // 3) Отвозим энергию в экстеншены
            let extension = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_EXTENSION && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });

            if (extension) {
                if (creep.transfer(extension, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, extension, {
                        reusePath: 5
                    });
                }
                return;
            }

            // 4) Отвозим энергию в storage
            let storage = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_STORAGE && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });

            if (storage) {
                if (creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, storage, {
                        reusePath: 5
                    });
                }
            }
        } else {
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
                    source.creepsGoing = creepMovement.countCreepsGoingToSource(source.id, creep.room.name, 'mover');
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

            // 1) С земли (приоритет) - если нет других источников
            let drop = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
                filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount > 0
            });

            if (drop) {
                if (creep.pickup(drop) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, drop, { reusePath: 5 });
                }
                return;
            }

            // 2) Линк на позиции (21,18) - приоритет
            let linkPos = new RoomPosition(21, 18, creep.room.name);
            let linkStruct = linkPos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_LINK && s.store[RESOURCE_ENERGY] > 0);
            if (linkStruct) {
                if (creep.withdraw(linkStruct, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, linkStruct, { reusePath: 5 });
                }
                return;
            }

            // 3) Контейнеры в 1 клетке от источника
            let targetContainers = [
                new RoomPosition(25, 5, creep.room.name),
                new RoomPosition(25, 6, creep.room.name),
                new RoomPosition(25, 7, creep.room.name),
            ];
            let targetContainer = null;
            for (let pos of targetContainers) {
                let container = pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0);
                if (container) { targetContainer = container; break; }
            }
            if (targetContainer) {
                if (creep.withdraw(targetContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, targetContainer, { reusePath: 5 });
                }
                return;
            }

            // 4) Storage - только если есть куда доставить
            let hasDeliveryTarget = false;

            let spawnNeedsEnergy = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_SPAWN && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            }).length > 0;

            let towerNeedsEnergy = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_TOWER && s.store[RESOURCE_ENERGY] < s.store.getCapacity(RESOURCE_ENERGY) * 0.5
            }).length > 0;

            let extensionNeedsEnergy = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_EXTENSION && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            }).length > 0;

            if (spawnNeedsEnergy || towerNeedsEnergy || extensionNeedsEnergy) {
                hasDeliveryTarget = true;
            }

            if (hasDeliveryTarget) {
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

            // Нет работы — к центру комнаты
            creepMovement.moveTo(creep, new RoomPosition(25, 25, creep.room.name), { reusePath: 10 });
        }
    }
};

module.exports = roleMover;
