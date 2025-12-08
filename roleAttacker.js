const creepMovement = require('./creepMovement');

module.exports = {
    run: function(creep) {
        const targetRoom = creep.memory.targetRoom;
        /*if (!targetRoom) return;

        if (creep.room.name !== targetRoom) {
            creepMovement.moveTo(creep, new RoomPosition(25, 25, targetRoom), {
                reusePath: 20
            });
            return;
        }

        let hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS);

        if (hostileCreeps.length > 0) {
            let target = creep.pos.findClosestByRange(hostileCreeps);

            if (target) {
                let range = creep.pos.getRangeTo(target);

                if (range <= 1) {
                    creep.attack(target);
                } else if (range <= 3) {
                    creep.rangedAttack(target);
                }

                if (range > 1) {
                    creepMovement.moveTo(creep, target, {
                        range: 1,
                        reusePath: 5
                    });
                }
            }
        } else {
            let centerPos = new RoomPosition(25, 25, targetRoom);
            creepMovement.moveTo(creep, centerPos, {
                reusePath: 10
            });
        }*/
    }
};


/*
* const creepMovement = require('./creepMovement');

module.exports = {
    run: function(creep) {
        const targetRoom = 'W23N55'; // Комната, в которую крип должен идти по умолчанию
        const fallbackRoom = 'W23N56'; // Комната, куда крип идет, если его здоровье меньше 99%

        // Проверяем здоровье крипа
        if (creep.hits < creep.hitsMax) {
            // Если здоровье меньше 99%, идем в комнату W23N56
            creepMovement.moveTo(creep, new RoomPosition(46, 49, fallbackRoom), {
                reusePath: 20
            });
            return;
        }

        // Если крип в нужной комнате, продолжаем логику
        if (creep.room.name !== targetRoom) {
            creepMovement.moveTo(creep, new RoomPosition(46, 0, targetRoom), {
                reusePath: 20
            });
            return;
        }

        // Проверяем наличие врагов в комнате
        let hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS);
        if (hostileCreeps.length > 0) {
            // Если враги есть, находим ближайшего
            let target = creep.pos.findClosestByRange(hostileCreeps);

            if (target) {
                let range = creep.pos.getRangeTo(target);

                // Если крип рядом с врагом, атакует его
                if (range <= 1) {
                    creep.attack(target);
                } else if (range <= 3) {
                    creep.rangedAttack(target);
                }

                // Двигаемся к врагу, если он далеко
                if (range > 1) {
                    creepMovement.moveTo(creep, target, {
                        range: 1,
                        reusePath: 5
                    });
                }
            }
        } else {
            // Если врагов нет, проверяем наличие пути к спавну врага
            const enemySpawn = Game.spawns['667d098f7a42e5522ef5ab40'] || Game.spawns['66848db3b91aba7f45511a1e'] || Game.spawns['66848db3b91aba7f45511a1e'];  // Замените на правильный ID спавна врага
            if (enemySpawn && creep.pos.findPathTo(enemySpawn).length === 0) {
                // Если путь к спавну закрыт, атакуем ближайшую постройку (стены, рампарты и т.д.)
                const closestStructure = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType === STRUCTURE_WALL ||
                            structure.structureType === STRUCTURE_RAMPART ||
                            structure.structureType === STRUCTURE_SPAWN ||
                            structure.structureType === STRUCTURE_TOWER ||
                            structure.structureType === STRUCTURE_EXTENSION);
                    }
                });

                if (closestStructure) {
                    // Атакуем ближайшую постройку
                    if (creep.attack(closestStructure) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, closestStructure, {
                            range: 1,
                            reusePath: 5
                        });
                    }
                }
            } else {
                // Если путь к спавну есть, идем в центр комнаты
                let centerPos = new RoomPosition(25, 25, targetRoom);
                creepMovement.moveTo(creep, centerPos, {
                    reusePath: 10
                });
            }
        }
    }
};
*/
