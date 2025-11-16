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

    // Получает настройку ignoreCreeps: младший уступает дорогу (false), старший проходит (true)
    getMoveOptions: function(creep, baseOptions = {}) {
        if (creep.memory.role === 'bobInvader') {
            return {
                ...baseOptions,
                ignoreCreeps: false
            };
        }
        // Бурильщик всегда имеет приоритет - все ему уступают
        if (creep.memory.role === 'driller') {
            return {
                ...baseOptions,
                ignoreCreeps: true // Бурильщик всегда проходит
            };
        }

        // Проверяем, есть ли рядом другие крипы
        let otherCreeps = creep.room.find(FIND_CREEPS, {
            filter: (c) => c !== creep && c.memory && c.memory.role && c.pos.getRangeTo(creep) <= 2
        });
        
        let shouldYield = false;
        if (otherCreeps.length > 0) {
            // Если рядом есть бурильщик - всегда уступаем ему дорогу
            let hasDriller = otherCreeps.some(c => c.memory && c.memory.role === 'driller');
            if (hasDriller) {
                shouldYield = true;
            } else if (creep.memory.role === 'filler') {
                // Заправщик уступает дорогу муверу
                let hasMover = otherCreeps.some(c => c.memory && c.memory.role === 'mover');
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
        let options = this.getMoveOptions(creep, baseOptions);
        return creep.moveTo(target, options);
    }
};

module.exports = creepMovement;
