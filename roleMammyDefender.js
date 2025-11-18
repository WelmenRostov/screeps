const creepMovement = require('./creepMovement');

let roleMammyDefender = {
    run: function(creep) {
        new RoomVisual(creep.room.name).text('🛡️', creep.pos.x, creep.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });

        const targetRoom = creep.memory.targetRoom || 'W24N56';

        // Если крип не в нужной комнате, перемещаем его туда
        if (creep.room.name !== targetRoom) {
            creepMovement.moveTo(creep, new RoomPosition(25, 25, targetRoom), {
                reusePath: 20,
                visualizePathStyle: { stroke: '#ff0000' }
            });
            return;
        }

        // Ищем враждебных крипов в радиусе 5 клеток
        let nearbyHostiles = creep.room.find(FIND_HOSTILE_CREEPS, {
            filter: c => creep.pos.getRangeTo(c) <= 5
        });

        // Если в радиусе 5 клеток нет врагов и здоровье не полное - восстанавливаемся
        if (nearbyHostiles.length === 0 && creep.hits < creep.hitsMax) {
            creep.heal(creep);
            return;
        }

        // Ищем всех враждебных крипов в комнате
        let hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS);

        // Если есть враги, атакуем их
        if (hostileCreeps.length > 0) {
            let target = creep.pos.findClosestByPath(hostileCreeps);

            if (target) {
                let range = creep.pos.getRangeTo(target);

                if (range <= 1) {
                    creep.attack(target);
                    if (creep.hits < creep.hitsMax) {
                        creep.heal(creep);
                    }
                } else if (range <= 3) {
                    creep.rangedAttack(target);
                    if (creep.hits < creep.hitsMax) {
                        creep.rangedHeal(creep);
                    }
                } else {
                    if (creep.hits < creep.hitsMax) {
                        creep.heal(creep);
                    }
                }

                if (range > 1) {
                    let path = creep.pos.findPathTo(target, {
                        ignoreCreeps: false
                    });
                    
                    if (path.length > 0) {
                        let nextPos = new RoomPosition(path[0].x, path[0].y, creep.room.name);
                        let blockingCreeps = nextPos.lookFor(LOOK_CREEPS);
                        let blockingCreep = blockingCreeps.find(c => c.id !== creep.id);
                        
                        if (blockingCreep) {
                            if (!blockingCreep.my) {
                                if (creep.attack(blockingCreep) === ERR_NOT_IN_RANGE) {
                                    creepMovement.moveTo(creep, blockingCreep, {
                                        reusePath: 2,
                                        visualizePathStyle: { stroke: '#ff0000' }
                                    });
                                }
                                return;
                            } else {
                                // Пытаемся найти обходной путь
                                let altPath = creep.pos.findPathTo(target, {
                                    ignoreCreeps: true,
                                    costCallback: function(roomName, costMatrix) {
                                        let room = Game.rooms[roomName];
                                        if (!room) return;
                                        let creeps = room.find(FIND_CREEPS);
                                        for (let c of creeps) {
                                            if (c.id !== creep.id && c.my) {
                                                costMatrix.set(c.pos.x, c.pos.y, 255);
                                            }
                                        }
                                        return costMatrix;
                                    }
                                });
                                
                                if (altPath.length > 0) {
                                    let moveDir = creep.pos.getDirectionTo(altPath[0].x, altPath[0].y);
                                    creep.move(moveDir);
                                    return;
                                } else {
                                    // Если обходной путь не найден, пытаемся обойти вручную
                                    let directions = [
                                        { dir: TOP, dx: 0, dy: -1 },
                                        { dir: TOP_RIGHT, dx: 1, dy: -1 },
                                        { dir: RIGHT, dx: 1, dy: 0 },
                                        { dir: BOTTOM_RIGHT, dx: 1, dy: 1 },
                                        { dir: BOTTOM, dx: 0, dy: 1 },
                                        { dir: BOTTOM_LEFT, dx: -1, dy: 1 },
                                        { dir: LEFT, dx: -1, dy: 0 },
                                        { dir: TOP_LEFT, dx: -1, dy: -1 }
                                    ];
                                    let found = false;
                                    for (let { dir, dx, dy } of directions) {
                                        let testPos = new RoomPosition(
                                            creep.pos.x + dx,
                                            creep.pos.y + dy,
                                            creep.room.name
                                        );
                                        if (testPos.isValid() && testPos.lookFor(LOOK_CREEPS).length === 0) {
                                            let testPath = testPos.findPathTo(target, { ignoreCreeps: true });
                                            if (testPath.length > 0 && testPath.length < path.length + 3) {
                                                creep.move(dir);
                                                found = true;
                                                break;
                                            }
                                        }
                                    }
                                    if (found) return;
                                }
                            }
                        }
                    }
                    
                    creepMovement.moveTo(creep, target, {
                        reusePath: 5,
                        visualizePathStyle: { stroke: '#ff0000' },
                        costCallback: function(roomName, costMatrix) {
                            let room = Game.rooms[roomName];
                            if (!room) return;
                            let creeps = room.find(FIND_CREEPS);
                            for (let c of creeps) {
                                if (c.id !== creep.id && c.my) {
                                    costMatrix.set(c.pos.x, c.pos.y, 50);
                                }
                            }
                            return costMatrix;
                        }
                    });
                }
            }
            return;
        }

        // Если в комнате нет врагов, ищем Source Keeper (структуры, контролирующие источники)
        let sourceKeepers = creep.room.find(FIND_STRUCTURES, {
            filter: structure => structure.structureType === STRUCTURE_KEEPER_LAIR
        });

        // Если есть Source Keeper, выбираем тот, у которого наименьший оставшийся таймер
        if (sourceKeepers.length > 0) {
            sourceKeepers.sort((a, b) => a.ticksToSpawn - b.ticksToSpawn);
            let closestSourceKeeper = sourceKeepers[0];

            // Проверяем, не заблокирован ли путь
            let path = creep.pos.findPathTo(closestSourceKeeper, { ignoreCreeps: false });
            if (path.length > 0) {
                let nextPos = new RoomPosition(path[0].x, path[0].y, creep.room.name);
                let blockingCreeps = nextPos.lookFor(LOOK_CREEPS);
                let blockingCreep = blockingCreeps.find(c => c.id !== creep.id);
                
                if (blockingCreep && blockingCreep.my) {
                    // Пытаемся найти обходной путь
                    let altPath = creep.pos.findPathTo(closestSourceKeeper, {
                        ignoreCreeps: true,
                        costCallback: function(roomName, costMatrix) {
                            let room = Game.rooms[roomName];
                            if (!room) return;
                            let creeps = room.find(FIND_CREEPS);
                            for (let c of creeps) {
                                if (c.id !== creep.id && c.my) {
                                    costMatrix.set(c.pos.x, c.pos.y, 255);
                                }
                            }
                            return costMatrix;
                        }
                    });
                    
                    if (altPath.length > 0) {
                        let moveDir = creep.pos.getDirectionTo(altPath[0].x, altPath[0].y);
                        creep.move(moveDir);
                        return;
                    }
                }
            }

            // Двигаемся к ближайшему Source Keeper
            creepMovement.moveTo(creep, closestSourceKeeper, {
                reusePath: 5,
                visualizePathStyle: { stroke: '#00ff00' },
                costCallback: function(roomName, costMatrix) {
                    let room = Game.rooms[roomName];
                    if (!room) return;
                    let creeps = room.find(FIND_CREEPS);
                    for (let c of creeps) {
                        if (c.id !== creep.id && c.my) {
                            costMatrix.set(c.pos.x, c.pos.y, 50);
                        }
                    }
                    return costMatrix;
                }
            });
            return;
        }

        // Если нет врагов и Source Keeper, просто двигаемся в центр комнаты
        let pathToCenter = creep.pos.findPathTo(new RoomPosition(25, 25, targetRoom), { ignoreCreeps: false });
        if (pathToCenter.length > 0) {
            let nextPos = new RoomPosition(pathToCenter[0].x, pathToCenter[0].y, creep.room.name);
            let blockingCreeps = nextPos.lookFor(LOOK_CREEPS);
            let blockingCreep = blockingCreeps.find(c => c.id !== creep.id);
            
            if (blockingCreep && blockingCreep.my) {
                // Пытаемся найти обходной путь
                let altPath = creep.pos.findPathTo(new RoomPosition(25, 25, targetRoom), {
                    ignoreCreeps: true,
                    costCallback: function(roomName, costMatrix) {
                        let room = Game.rooms[roomName];
                        if (!room) return;
                        let creeps = room.find(FIND_CREEPS);
                        for (let c of creeps) {
                            if (c.id !== creep.id && c.my) {
                                costMatrix.set(c.pos.x, c.pos.y, 255);
                            }
                        }
                        return costMatrix;
                    }
                });
                
                if (altPath.length > 0) {
                    let moveDir = creep.pos.getDirectionTo(altPath[0].x, altPath[0].y);
                    creep.move(moveDir);
                    return;
                }
            }
        }
        
        creepMovement.moveTo(creep, new RoomPosition(25, 25, targetRoom), {
            reusePath: 20,
            visualizePathStyle: { stroke: '#ffffff' },
            costCallback: function(roomName, costMatrix) {
                let room = Game.rooms[roomName];
                if (!room) return;
                let creeps = room.find(FIND_CREEPS);
                for (let c of creeps) {
                    if (c.id !== creep.id && c.my) {
                        costMatrix.set(c.pos.x, c.pos.y, 50);
                    }
                }
                return costMatrix;
            }
        });
    }
};

module.exports = roleMammyDefender;
