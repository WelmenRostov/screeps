const spawnModule = require('./spawnModule');

const ASSAULT_ROUTE = ['W23N56', 'W22N56', 'W23N55'];

let assaultSquad = {
    startAssault: function(targetRoom, meleeCount, rangedCount, healerCount, route) {
        if (Memory.assaultSquad) {
            let squad = Memory.assaultSquad;
            let squadId = squad.squadId;
            let remnants = Object.values(Game.creeps).some(c => c.memory && c.memory.assaultSquadId === squadId);
            if (!remnants && squad.state !== 'attacking') {
                delete Memory.assaultSquad;
            } else if (squad.state === 'attacking') {
                console.log('❌ Сквад штурма уже активен');
                return;
            }
        }

        let squadId = `assault_${Game.time}`;
        let spawn = Game.spawns['Mammy'];
        if (!spawn) {
            console.log('❌ Спавн Mammy не найден');
            return;
        }

        Memory.assaultSquad = {
            squadId: squadId,
            targetRoom: targetRoom,
            meleeNeeded: meleeCount,
            rangedNeeded: rangedCount,
            healerNeeded: healerCount,
            meleeSpawned: 0,
            rangedSpawned: 0,
            healerSpawned: 0,
            state: 'spawning',
            spawnName: 'Mammy',
            route: route ? route.slice() : ASSAULT_ROUTE.slice()
        };

        console.log(`⚔️ Сквад штурма создан: ${meleeCount} ближников, ${rangedCount} стрелков, ${healerCount} хиллеров`);
    },

    tick: function() {
        if (!Memory.assaultSquad) return false;

        let squad = Memory.assaultSquad;
        let spawn = Game.spawns[squad.spawnName || 'Mammy'];

        if (!spawn) {
            delete Memory.assaultSquad;
            return false;
        }

        if (squad.state === 'spawning') {
            if (squad.forceLaunch) {
                squad.state = 'attacking';
                console.log(`🚀 Сквад штурма принудительно запущен в атаку`);
                return false;
            }

            let melees = Object.values(Game.creeps).filter(c => c.memory.assaultSquadId === squad.squadId && c.memory.role === 'assaultMelee');
            let rangeds = Object.values(Game.creeps).filter(c => c.memory.assaultSquadId === squad.squadId && c.memory.role === 'assaultRanged');
            let healers = Object.values(Game.creeps).filter(c => c.memory.assaultSquadId === squad.squadId && c.memory.role === 'assaultHealer');

            squad.meleeSpawned = melees.length;
            squad.rangedSpawned = rangeds.length;
            squad.healerSpawned = healers.length;

            const needsMelee = squad.meleeSpawned < squad.meleeNeeded;
            const needsRanged = squad.rangedSpawned < squad.rangedNeeded;
            const needsHealers = squad.healerSpawned < squad.healerNeeded;

            if (needsMelee && !spawn.spawning) {
                let result = spawnModule.spawnAssaultMelee(squad.targetRoom, { assaultSquadId: squad.squadId, route: squad.route });
                if (result === OK) {
                    console.log(`⚔️ Ближник ${squad.meleeSpawned + 1}/${squad.meleeNeeded} создан`);
                }
                return true;
            }

            if (needsRanged && !spawn.spawning) {
                let result = spawnModule.spawnAssaultRanged(squad.targetRoom, { assaultSquadId: squad.squadId, route: squad.route });
                if (result === OK) {
                    console.log(`🏹 Стрелок ${squad.rangedSpawned + 1}/${squad.rangedNeeded} создан`);
                }
                return true;
            }

            if (needsHealers && !spawn.spawning) {
                let result = spawnModule.spawnAssaultHealer(squad.targetRoom, { assaultSquadId: squad.squadId, route: squad.route });
                if (result === OK) {
                    console.log(`💊 Хиллер ${squad.healerSpawned + 1}/${squad.healerNeeded} создан`);
                }
                return true;
            }

            if (!needsMelee && !needsRanged && !needsHealers) {
                squad.state = 'moving';
                console.log(`✅ Все крипы сквада заспавнены, блокировка снята`);
                return false;
            }

            return true;
        }

        if (squad.state === 'moving') {
            let melees = Object.values(Game.creeps).filter(c => c.memory.assaultSquadId === squad.squadId && c.memory.role === 'assaultMelee');
            let rangeds = Object.values(Game.creeps).filter(c => c.memory.assaultSquadId === squad.squadId && c.memory.role === 'assaultRanged');
            let healers = Object.values(Game.creeps).filter(c => c.memory.assaultSquadId === squad.squadId && c.memory.role === 'assaultHealer');

            if (melees.length < squad.meleeNeeded || rangeds.length < squad.rangedNeeded || healers.length < squad.healerNeeded) {
                if (!squad.forceLaunch) {
                    squad.state = 'spawning';
                    return true;
                }
            }

            let assemblyRoom = squad.route[squad.route.length - 1];
            let assemblyCenter = new RoomPosition(25, 25, assemblyRoom);
            let allInAssemblyRoom = true;
            let allClose = true;

            for (let creep of [...melees, ...rangeds, ...healers]) {
                if (creep.room.name !== assemblyRoom) {
                    allInAssemblyRoom = false;
                    break;
                }
            }

            if (allInAssemblyRoom) {
                for (let creep of [...melees, ...rangeds, ...healers]) {
                    if (creep.pos.getRangeTo(assemblyCenter) > 10) {
                        allClose = false;
                        break;
                    }
                }

                if (allClose) {
                    squad.state = 'attacking';
                    console.log(`🚀 Сквад штурма готов к атаке на ${squad.targetRoom}!`);
                }
            }
            return false;
        }

        if (squad.state === 'attacking') {
            let melees = Object.values(Game.creeps).filter(c => c.memory.assaultSquadId === squad.squadId && c.memory.role === 'assaultMelee');
            let rangeds = Object.values(Game.creeps).filter(c => c.memory.assaultSquadId === squad.squadId && c.memory.role === 'assaultRanged');
            let healers = Object.values(Game.creeps).filter(c => c.memory.assaultSquadId === squad.squadId && c.memory.role === 'assaultHealer');

            if (melees.length === 0 && rangeds.length === 0 && healers.length === 0) {
                delete Memory.assaultSquad;
                console.log('💀 Сквад штурма уничтожен');
                return false;
            }
            return false;
        }

        return false;
    },

    launchAssault: function() {
        if (!Memory.assaultSquad) {
            console.log('❌ Сквад штурма не найден');
            return;
        }

        let squad = Memory.assaultSquad;
        if (squad.state === 'attacking') {
            console.log('✅ Сквад штурма уже в атаке');
            return;
        }

        squad.forceLaunch = true;
        squad.state = 'attacking';
        console.log(`🚀 Сквад штурма принудительно отправлен в атаку на ${squad.targetRoom}! Спавн остановлен.`);
    }
};

module.exports = assaultSquad;

