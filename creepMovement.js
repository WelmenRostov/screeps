// Общий модуль для управления движением крипов с уступкой дороги
let creepMovement = {
    // Получает возраст крипа из имени (номер в конце имени)
    getCreepAge: function(creep) {
        let match = creep.name.match(/\d+$/);
        return match ? parseInt(match[0]) : Game.time;
    },

    // Старший ли этот крип относительно другого
    isOlderThan: function(creep, otherCreep) {
        return this.getCreepAge(creep) < this.getCreepAge(otherCreep);
    },

    // Подсчитывает количество крипов, идущих к источнику (с мемоизацией)
    countCreepsGoingToSource: function(sourceId, roomName, role) {
        if (!Memory.movers) {
            Memory.movers = {};
        }
        if (!Memory.movers[roomName]) {
            Memory.movers[roomName] = {};
        }
        
        let cache = Memory.movers[roomName];
        if (!cache[role]) {
            cache[role] = {};
        }
        
        let roleCache = cache[role];
        if (roleCache.lastTick !== Game.time) {
            roleCache.counts = {};
            roleCache.lastTick = Game.time;
            
            for (let name in Game.creeps) {
                let c = Game.creeps[name];
                if (c.memory && c.memory.role === role && c.memory.committedTargetId) {
                    let targetId = c.memory.committedTargetId;
                    roleCache.counts[targetId] = (roleCache.counts[targetId] || 0) + 1;
                }
            }
        }
        
        return roleCache.counts[sourceId] || 0;
    },


    // Получает настройку ignoreCreeps: младший уступает дорогу (false), старший проходит (true)
    getMoveOptions: function(creep, baseOptions = {}) {
        if (creep.memory.role === 'bobInvader') {
            return {
                ...baseOptions,
                ignoreCreeps: false
            };
        }
        
        if (creep.memory.role === 'mammyHealer') {
            return {
                ...baseOptions,
                ignoreCreeps: false
            };
        }
        
        if (creep.memory.role === 'bobRepairer') {
            return {
                ...baseOptions,
                ignoreCreeps: false
            };
        }
        
        let isMover = creep.memory.role === 'mover' || 
                      creep.memory.role === 'bobMover' || 
                      creep.memory.role === 'steveMover';
        
        if (isMover) {
            let otherCreeps = creep.room.find(FIND_CREEPS, {
                filter: (c) => c !== creep && c.memory && c.memory.role && c.pos.getRangeTo(creep) <= 2
            });
            
            if (otherCreeps.length > 0) {
                let otherMovers = otherCreeps.filter(c => {
                    let role = c.memory.role;
                    return role === 'mover' || role === 'bobMover' || role === 'steveMover';
                });
                
                if (otherMovers.length > 0) {
                    let hasOlderMover = otherMovers.some(c => this.isOlderThan(c, creep));
                    if (hasOlderMover) {
                        return {
                            ...baseOptions,
                            ignoreCreeps: false
                        };
                    }
                }
                
                return {
                    ...baseOptions,
                    ignoreCreeps: false
                };
            }
            
            return {
                ...baseOptions,
                ignoreCreeps: false
            };
        }
        
        // Бурильщик всегда имеет приоритет - все ему уступают
        if (creep.memory.role === 'driller') {
            return {
                ...baseOptions,
                ignoreCreeps: true
            };
        }
        
        // Защитник всегда имеет приоритет - все ему уступают
        if (creep.memory.role === 'mammyDefender') {
            return {
                ...baseOptions,
                ignoreCreeps: true
            };
        }
        
        if (creep.memory.role === 'mammyRanged') {
            return {
                ...baseOptions,
                ignoreCreeps: false
            };
        }

        // Проверяем, есть ли рядом другие крипы
        let otherCreeps = creep.room.find(FIND_CREEPS, {
            filter: (c) => c !== creep && c.memory && c.memory.role && c.pos.getRangeTo(creep) <= 2
        });
        
        let shouldYield = false;
        if (otherCreeps.length > 0) {
            // Ranged уступают дорогу лидеру сквада
            if (creep.memory.role === 'mammyRanged') {
                let targetRoom = creep.memory.targetRoom || (creep.room ? creep.room.name : null);
                if (targetRoom && Memory.mammyRangedSquad && Memory.mammyRangedSquad[targetRoom]) {
                    let squad = Memory.mammyRangedSquad[targetRoom];
                    let leaderId = squad.leaderId;
                    if (leaderId && leaderId !== creep.id) {
                        let hasLeader = otherCreeps.some(c => c.id === leaderId);
                        if (hasLeader) {
                            shouldYield = true;
                        }
                    }
                }
            }
            
            // Хиллеры всегда уступают дорогу защитникам
            if (creep.memory.role === 'bobHealer') {
                let hasDefender = otherCreeps.some(c => c.memory && c.memory.role === 'mammyDefender');
                if (hasDefender) {
                    shouldYield = true;
                }
            }
            
            // Если рядом есть бурильщик - всегда уступаем ему дорогу
            let hasDriller = otherCreeps.some(c => c.memory && c.memory.role === 'driller');
            if (hasDriller) {
                shouldYield = true;
            } else if (creep.memory.role === 'filler') {
                // Заправщик уступает дорогу муверу
                let hasMover = otherCreeps.some(c => {
                    let role = c.memory.role;
                    return role === 'mover' || role === 'bobMover' || role === 'steveMover';
                });
                if (hasMover) {
                    shouldYield = true;
                } else {
                    shouldYield = otherCreeps.some(c => this.isOlderThan(c, creep));
                }
            } else {
                // Если есть старшие крипы рядом - младший уступает дорогу
                shouldYield = otherCreeps.some(c => this.isOlderThan(c, creep));
            }
        }
        
        return {
            ...baseOptions,
            ignoreCreeps: !shouldYield // Младший уступает (ignoreCreeps: false), старший проходит (ignoreCreeps: true)
        };
    },

    // Обёртка для moveTo с автоматической уступкой дороги
    moveTo: function(creep, target, baseOptions = {}) {
        if (global.__useRevolutionCPU) {
            const legacyAdapter = require('revolutionCPU/movement.legacyAdapter');
            return legacyAdapter.moveTo(creep, target, baseOptions);
        }
        let options = this.getMoveOptions(creep, baseOptions);
        return creep.moveTo(target, options);
    }
};

module.exports = creepMovement;
