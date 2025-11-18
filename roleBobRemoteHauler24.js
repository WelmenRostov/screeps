const creepMovement = require('./creepMovement');

let roleBobRemoteHauler24 = {
    run: function(creep) {
        new RoomVisual(creep.room.name).text('📦', creep.pos.x, creep.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });

        const targetRoom = creep.memory.targetRoom || 'W24N56';
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
                creepMovement.moveTo(creep, new RoomPosition(25, 25, targetRoom), {
                    reusePath: 15,
                    visualizePathStyle: { stroke: '#ffaa00' }
                });
                return;
            }

            let powerDrop = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, { filter: r => r.resourceType === RESOURCE_POWER });
            if (powerDrop && creep.store.getFreeCapacity(RESOURCE_POWER) > 0) {
                if (creep.pickup(powerDrop) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, powerDrop, { reusePath: 5, visualizePathStyle: { stroke: '#ff00ff' } });
                }
                return;
            }

            let powerTombstone = creep.pos.findClosestByPath(FIND_TOMBSTONES, { filter: t => t.store && t.store[RESOURCE_POWER] > 0 });
            if (powerTombstone && creep.store.getFreeCapacity(RESOURCE_POWER) > 0) {
                if (creep.withdraw(powerTombstone, RESOURCE_POWER) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, powerTombstone, { reusePath: 5, visualizePathStyle: { stroke: '#ff00ff' } });
                }
                return;
            }

            let powerRuin = creep.pos.findClosestByPath(FIND_RUINS, { filter: r => r.store && r.store[RESOURCE_POWER] > 0 });
            if (powerRuin && creep.store.getFreeCapacity(RESOURCE_POWER) > 0) {
                if (creep.withdraw(powerRuin, RESOURCE_POWER) === ERR_NOT_IN_RANGE) {
                    creepMovement.moveTo(creep, powerRuin, { reusePath: 5, visualizePathStyle: { stroke: '#ff00ff' } });
                }
                return;
            }

            let ruins = creep.room.find(FIND_RUINS, {
                filter: r => r.store && (r.store[RESOURCE_ENERGY] || 0) > 0
            });
            if (ruins.length > 0) {
                let bestRuin = null;
                let bestAmount = 0;
                for (let r of ruins) {
                    let amount = r.store[RESOURCE_ENERGY] || 0;
                    if (amount > bestAmount) {
                        bestAmount = amount;
                        bestRuin = r;
                    }
                }
                if (bestRuin) {
                    if (creep.withdraw(bestRuin, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, bestRuin, { reusePath: 5, visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                    return;
                }
            }

            let dropsNoContainer = creep.room.find(FIND_DROPPED_RESOURCES, {
                filter: r => {
                    if (r.resourceType !== RESOURCE_ENERGY || r.amount <= 0) return false;
                    let structs = r.pos.lookFor(LOOK_STRUCTURES);
                    return !structs.some(s => s.structureType === STRUCTURE_CONTAINER);
                }
            });
            if (dropsNoContainer.length > 0) {
                let bestDrop = null;
                let bestAmount = 0;
                for (let d of dropsNoContainer) {
                    if (d.amount > bestAmount) {
                        bestAmount = d.amount;
                        bestDrop = d;
                    }
                }
                if (bestDrop) {
                    if (creep.pickup(bestDrop) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, bestDrop, { reusePath: 5, visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                    return;
                }
            }

            let dropsWithContainer = creep.room.find(FIND_DROPPED_RESOURCES, {
                filter: r => {
                    if (r.resourceType !== RESOURCE_ENERGY || r.amount <= 0) return false;
                    let structs = r.pos.lookFor(LOOK_STRUCTURES);
                    let container = structs.find(s => s.structureType === STRUCTURE_CONTAINER && s.store);
                    if (!container) return false;
                    let contEnergy = container.store[RESOURCE_ENERGY] || 0;
                    return contEnergy < r.amount;
                }
            });
            if (dropsWithContainer.length > 0) {
                let bestDrop = null;
                let bestAmount = 0;
                for (let d of dropsWithContainer) {
                    if (d.amount > bestAmount) {
                        bestAmount = d.amount;
                        bestDrop = d;
                    }
                }
                if (bestDrop) {
                    if (creep.pickup(bestDrop) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, bestDrop, { reusePath: 5, visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                    return;
                }
            }

            let containers = creep.room.find(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_CONTAINER && (s.store[RESOURCE_ENERGY] || 0) > 0
            });
            if (containers.length > 0) {
                let bestContainer = null;
                let bestAmount = 0;
                for (let c of containers) {
                    let amount = c.store[RESOURCE_ENERGY] || 0;
                    if (amount > bestAmount) {
                        bestAmount = amount;
                        bestContainer = c;
                    }
                }
                if (bestContainer) {
                    if (creep.withdraw(bestContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, bestContainer, { reusePath: 5, visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                    return;
                }
            }

            if (creep.room.name === targetRoom) {
                const waitPos = new RoomPosition(19, 48, targetRoom);
                if (!creep.pos.isEqualTo(waitPos)) {
                    creepMovement.moveTo(creep, waitPos, {
                        reusePath: 10,
                        visualizePathStyle: { stroke: '#00ff00' }
                    });
                }
                return;
            }

            creepMovement.moveTo(creep, new RoomPosition(25, 25, targetRoom), {
                reusePath: 10,
                visualizePathStyle: { stroke: '#00ff00' }
            });
        } else {
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
                        reusePath: 15,
                        visualizePathStyle: { stroke: '#ffffff' }
                    });
                    return;
                }

                for (let resource in creep.store) {
                    if (creep.store[resource] > 0) {
                        if (creep.transfer(storage, resource) === ERR_NOT_IN_RANGE) {
                            creepMovement.moveTo(creep, storage, { reusePath: 5, visualizePathStyle: { stroke: '#ffffff' } });
                        }
                        return;
                    }
                }
            } else {
                if (creep.room.name !== homeRoom) {
                    creepMovement.moveTo(creep, new RoomPosition(25, 25, homeRoom), {
                        reusePath: 15,
                        visualizePathStyle: { stroke: '#ffffff' }
                    });
                    return;
                }

                let spawn = creep.room.find(FIND_MY_STRUCTURES, {
                    filter: s => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) &&
                        s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                })[0];
                if (spawn && creep.store[RESOURCE_ENERGY] > 0) {
                    if (creep.transfer(spawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, spawn, { reusePath: 5, visualizePathStyle: { stroke: '#ffffff' } });
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
                        creepMovement.moveTo(creep, idlePos, { reusePath: 10, visualizePathStyle: { stroke: '#00ffff' } });
                    }
                }
            }
        }
    }
};

module.exports = roleBobRemoteHauler24;
