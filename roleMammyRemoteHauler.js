const creepMovement = require('./creepMovement');

let roleMammyRemoteHauler = {
    run: function(creep) {
        new RoomVisual(creep.room.name).text('📦', creep.pos.x, creep.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });

        const targetRoom = creep.memory.targetRoom || 'W24N56';
        const homeRoom = creep.memory.homeRoom || (Game.spawns['Mammy'] ? Game.spawns['Mammy'].room.name : creep.room.name);
        if (!targetRoom || !homeRoom) return;

        const isFull = creep.store.getFreeCapacity() === 0;
        const hasResources = creep.store.getUsedCapacity() > 0;

        if (!isFull) {
            if (creep.room.name !== targetRoom) {
                creepMovement.moveTo(creep, new RoomPosition(25, 25, targetRoom), {
                    reusePath: 15,
                    ignoreCreeps: false,
                    costCallback: function(roomName, costMatrix) {
                        let room = Game.rooms[roomName];
                        if (!room) return costMatrix;
                        let creeps = room.find(FIND_CREEPS);
                        for (let c of creeps) {
                            if (c.id !== creep.id) {
                                costMatrix.set(c.pos.x, c.pos.y, 50);
                            }
                        }
                        return costMatrix;
                    },
                    visualizePathStyle: { stroke: '#ffaa00' }
                });
                return;
            }

            // Приоритет 1: Дропы (если не на клетке с контейнером)
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
                for (let drop of dropsNoContainer) {
                    if (drop.amount > bestAmount) {
                        bestAmount = drop.amount;
                        bestDrop = drop;
                    }
                }
                if (bestDrop) {
                    if (creep.pickup(bestDrop) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, bestDrop, {
                            reusePath: 5,
                            ignoreCreeps: false,
                            costCallback: function(roomName, costMatrix) {
                                let room = Game.rooms[roomName];
                                if (!room) return costMatrix;
                                let creeps = room.find(FIND_CREEPS);
                                for (let c of creeps) {
                                    if (c.id !== creep.id) {
                                        costMatrix.set(c.pos.x, c.pos.y, 50);
                                    }
                                }
                                return costMatrix;
                            },
                            visualizePathStyle: { stroke: '#ffaa00' }
                        });
                    }
                    return;
                }
            }

            // Приоритет 2: Дропы (если на клетке с контейнером, но дроп больше)
            let dropsWithContainer = creep.room.find(FIND_DROPPED_RESOURCES, {
                filter: r => {
                    if (r.resourceType !== RESOURCE_ENERGY || r.amount <= 0) return false;
                    let structs = r.pos.lookFor(LOOK_STRUCTURES);
                    let container = structs.find(s => s.structureType === STRUCTURE_CONTAINER);
                    if (container && container.store && (container.store[RESOURCE_ENERGY] || 0) < r.amount) {
                        return true;
                    }
                    return false;
                }
            });
            if (dropsWithContainer.length > 0) {
                let bestDrop = null;
                let bestAmount = 0;
                for (let drop of dropsWithContainer) {
                    if (drop.amount > bestAmount) {
                        bestAmount = drop.amount;
                        bestDrop = drop;
                    }
                }
                if (bestDrop) {
                    if (creep.pickup(bestDrop) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, bestDrop, {
                            reusePath: 5,
                            ignoreCreeps: false,
                            costCallback: function(roomName, costMatrix) {
                                let room = Game.rooms[roomName];
                                if (!room) return costMatrix;
                                let creeps = room.find(FIND_CREEPS);
                                for (let c of creeps) {
                                    if (c.id !== creep.id) {
                                        costMatrix.set(c.pos.x, c.pos.y, 50);
                                    }
                                }
                                return costMatrix;
                            },
                            visualizePathStyle: { stroke: '#ffaa00' }
                        });
                    }
                    return;
                }
            }

            // Приоритет 3: Контейнеры
            let containers = creep.room.find(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_CONTAINER && s.store && (s.store[RESOURCE_ENERGY] || 0) > 0
            });
            if (containers.length > 0) {
                let bestContainer = null;
                let bestAmount = 0;
                for (let container of containers) {
                    let amount = container.store[RESOURCE_ENERGY] || 0;
                    if (amount > bestAmount) {
                        bestAmount = amount;
                        bestContainer = container;
                    }
                }
                if (bestContainer) {
                    if (creep.withdraw(bestContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, bestContainer, {
                            reusePath: 5,
                            ignoreCreeps: false,
                            costCallback: function(roomName, costMatrix) {
                                let room = Game.rooms[roomName];
                                if (!room) return costMatrix;
                                let creeps = room.find(FIND_CREEPS);
                                for (let c of creeps) {
                                    if (c.id !== creep.id) {
                                        costMatrix.set(c.pos.x, c.pos.y, 50);
                                    }
                                }
                                return costMatrix;
                            },
                            visualizePathStyle: { stroke: '#ffaa00' }
                        });
                    }
                    return;
                }
            }

            // Приоритет 4: Руины (если нет ресурсов в контейнерах и на земле)
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
                        creepMovement.moveTo(creep, bestRuin, {
                            reusePath: 5,
                            ignoreCreeps: false,
                            costCallback: function(roomName, costMatrix) {
                                let room = Game.rooms[roomName];
                                if (!room) return costMatrix;
                                let creeps = room.find(FIND_CREEPS);
                                for (let c of creeps) {
                                    if (c.id !== creep.id) {
                                        costMatrix.set(c.pos.x, c.pos.y, 50);
                                    }
                                }
                                return costMatrix;
                            },
                            visualizePathStyle: { stroke: '#ffaa00' }
                        });
                    }
                    return;
                }
            }

            // Приоритет 5: Трупы (если нет ресурсов в контейнерах, на земле и в руинах)
            let tombstones = creep.room.find(FIND_TOMBSTONES, {
                filter: t => t.store && (t.store[RESOURCE_ENERGY] || 0) > 0
            });
            if (tombstones.length > 0) {
                let bestTombstone = null;
                let bestAmount = 0;
                for (let t of tombstones) {
                    let amount = t.store[RESOURCE_ENERGY] || 0;
                    if (amount > bestAmount) {
                        bestAmount = amount;
                        bestTombstone = t;
                    }
                }
                if (bestTombstone) {
                    if (creep.withdraw(bestTombstone, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, bestTombstone, {
                            reusePath: 5,
                            ignoreCreeps: false,
                            costCallback: function(roomName, costMatrix) {
                                let room = Game.rooms[roomName];
                                if (!room) return costMatrix;
                                let creeps = room.find(FIND_CREEPS);
                                for (let c of creeps) {
                                    if (c.id !== creep.id) {
                                        costMatrix.set(c.pos.x, c.pos.y, 50);
                                    }
                                }
                                return costMatrix;
                            },
                            visualizePathStyle: { stroke: '#ffaa00' }
                        });
                    }
                    return;
                }
            }

            // Если нет ресурсов, ждем в центре целевой комнаты
            creepMovement.moveTo(creep, new RoomPosition(25, 25, targetRoom), {
                reusePath: 10,
                ignoreCreeps: false,
                costCallback: function(roomName, costMatrix) {
                    let room = Game.rooms[roomName];
                    if (!room) return costMatrix;
                    let creeps = room.find(FIND_CREEPS);
                    for (let c of creeps) {
                        if (c.id !== creep.id) {
                            costMatrix.set(c.pos.x, c.pos.y, 50);
                        }
                    }
                    return costMatrix;
                },
                visualizePathStyle: { stroke: '#00ff00' }
            });
        } else if (hasResources) {
            if (creep.room.name !== homeRoom) {
                creepMovement.moveTo(creep, new RoomPosition(25, 25, homeRoom), {
                    reusePath: 15,
                    ignoreCreeps: false,
                    costCallback: function(roomName, costMatrix) {
                        let room = Game.rooms[roomName];
                        if (!room) return costMatrix;
                        let creeps = room.find(FIND_CREEPS);
                        for (let c of creeps) {
                            if (c.id !== creep.id) {
                                costMatrix.set(c.pos.x, c.pos.y, 50);
                            }
                        }
                        return costMatrix;
                    },
                    visualizePathStyle: { stroke: '#00ff00' }
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
                            reusePath: 5,
                            ignoreCreeps: false,
                            costCallback: function(roomName, costMatrix) {
                                let room = Game.rooms[roomName];
                                if (!room) return costMatrix;
                                let creeps = room.find(FIND_CREEPS);
                                for (let c of creeps) {
                                    if (c.id !== creep.id) {
                                        costMatrix.set(c.pos.x, c.pos.y, 50);
                                    }
                                }
                                return costMatrix;
                            },
                            visualizePathStyle: { stroke: '#00ff00' }
                        });
                        return;
                    }
                }
            } else {
                // Если нет сторгейта, ждем в центре комнаты
                creepMovement.moveTo(creep, new RoomPosition(25, 25, homeRoom), {
                    reusePath: 10,
                    ignoreCreeps: false,
                    costCallback: function(roomName, costMatrix) {
                        let room = Game.rooms[roomName];
                        if (!room) return costMatrix;
                        let creeps = room.find(FIND_CREEPS);
                        for (let c of creeps) {
                            if (c.id !== creep.id) {
                                costMatrix.set(c.pos.x, c.pos.y, 50);
                            }
                        }
                        return costMatrix;
                    },
                    visualizePathStyle: { stroke: '#00ff00' }
                });
            }
        }
    }
};

module.exports = roleMammyRemoteHauler;

