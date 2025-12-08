// ========================================================================
//  НАЧАЛО main
// ========================================================================

const spawnModule = require('./spawnModule');
const roleСourtier = require('./roleСourtier')
const roleBuilder = require('./roleBuilder');
const roleAttacker = require('./roleAttacker');
const roleHealer = require('./roleHealer');
const roleRat = require('./roleRat');
const roleClaimer = require('./roleClaimer');
const roleTower = require('./roleTower');
const roleDriller = require('./roleDriller');
const roleMover = require('./roleMover');
const roleUpdater = require('./roleUpdater');
const roleFiller = require('./roleFiller');
const roleInvader = require('./roleInvader');
const roleRemoteMiner = require('./roleRemoteMiner');
const roleRemoteHauler = require('./roleRemoteHauler');
const roleBobHarvester = require('./roleBobHarvester');
const roleBobRepairer = require('./roleBobRepairer');
const roleBobMover = require('./roleBobMover');
const roleBobHelper = require('./roleBobHelper');
const roleBobInvader = require('./roleBobInvader');
const roleBobInvaderW24N56 = require('./roleBobInvaderW24N56');
const roleBobLocalMiner = require('./roleBobLocalMiner');
const roleBobRemoteMiner = require('./roleBobRemoteMiner');
const roleBobRemoteMinerW24N56 = require('./roleBobRemoteMinerW24N56');
const roleBobRemoteHauler = require('./roleBobRemoteHauler');
const roleBobRemoteHaulerW24N56 = require('./roleBobRemoteHaulerW24N56');
const roleBobReserver = require('./roleBobReserver');
const roleBobHealer = require('./roleBobHealer');
const roleBobNanny = require('./roleBobNanny');
const rolePatrol = require('./rolePatrol');
const roleMammyDefender = require('./roleMammyDefender');
const roleMammyHealer = require('./roleMammyHealer');
const roleMammyNanny = require('./roleMammyNanny');
const roleMammyRemoteHauler = require('./roleMammyRemoteHauler');
const roleMammyTauer = require('./roleMammyTauer');
const roleMammyRanged = require('./roleMammyRanged');
const roleSteveUpdater = require('./roleSteveUpdater');
const roleSteveMiner = require('./roleSteveMiner');
const roleSteveMover = require('./roleSteveMover');
const roleSteveInvader = require('./roleSteveInvader');
const roleSteveInvaderTwo = require('./roleSteveInvaderTwo');
const roleSteveInvaderTree = require('./roleSteveInvaderTree');
const roleSteveRemoteMiner = require('./roleSteveRemoteMiner');
const roleSteveRanged = require('./roleMammyRanged');
const roleRemoteMinerTwo = require('./roleRemoteMinerTwo');
const roleRemoteMinerTree = require('./roleRemoteMinerTree');
const roleSteveRemoteHauler = require('./roleSteveRemoteHauler');
const roleSteveReserver = require('./roleSteveReserver');
const roleSteveReserverTwo = require('./roleSteveReserverTwo');
const roleSteveNanny = require('./roleSteveNanny');
const roleManager = require('./roleManager');
const spawnBobManager = require('./spawnBobManager');
const spawnSteveManager = require('./spawnSteveManager');
const roleSteveRepairer = require('./roleSteveRepairer');
const shutdownZone = require('./shutdownZone');

module.exports.loop = function () {

    if (!global.__bobPickupPatched) {
        const originalPickup = Creep.prototype.pickup;
        Creep.prototype.pickup = function(target) {
            if (target && this && this.pos && target.pos && this.pos.isEqualTo(target.pos)) {
                const container = this.pos
                    .lookFor(LOOK_STRUCTURES)
                    .find(s => s.structureType === STRUCTURE_CONTAINER && s.store && s.store[target.resourceType] > 0);
                if (container) {
                    const result = this.withdraw(container, target.resourceType);
                    if (result === OK || result === ERR_FULL) {
                        return result;
                    }
                }
            }
            return originalPickup.call(this, target);
        };
        global.__bobPickupPatched = true;
    }


    global.spawnModule = spawnModule;
    global.setPatrolPos = function(creepName, x, y, roomName) {
        let creep = Game.creeps[creepName];
        if (!creep) {
            console.log(`❌ Крип ${creepName} не найден`);
            return;
        }
        if (creep.memory.role !== 'patrol') {
            console.log(`❌ Крип ${creepName} не является патрульным`);
            return;
        }
        creep.memory.patrolPos = {x: x, y: y, roomName: roomName};
        console.log(`✅ Точка патруля для ${creepName} изменена на (${x}, ${y}) в комнате ${roomName}`);
    };
    global.changePatrolRoom = function(roomName, x, y) {
        x = x || 25;
        y = y || 25;
        let patrols = Object.values(Game.creeps).filter(c => c.memory.role === 'patrol');
        if (patrols.length === 0) {
            console.log(`❌ Патрульные не найдены`);
            return;
        }
        for (let patrol of patrols) {
            patrol.memory.patrolPos = {x: x, y: y, roomName: roomName};
            console.log(`✅ Точка патруля для ${patrol.name} изменена на (${x}, ${y}) в комнате ${roomName}`);
        }
    };
    global.sendCreepToRoom = function(creepName, targetRoom) {
        let creep = Game.creeps[creepName];
        if (!creep) {
            console.log(`❌ Крип ${creepName} не найден`);
            return;
        }
        creep.memory.shutdownZoneTargetRoom = targetRoom;
        console.log(`✅ Крип ${creepName} отправлен в комнату ${targetRoom}. Зона перестанет влиять на него когда он дойдет.`);
    };
    global.setCreepBadge = function(creepName, badge) {
        let creep = Game.creeps[creepName];
        if (!creep) {
            console.log(`❌ Крип ${creepName} не найден`);
            return;
        }
        creep.badge = badge;
        console.log(`✅ Декорация "${badge}" установлена на крипа ${creepName}`);
    };

// === Очистка памяти умерших крипов ===
    for (let name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }

    let spawn = Game.spawns['Mammy'];

    if (spawn) {
        spawn.room.visual.text('' +
            'Уничтоженные:  1. joe95_1'
            , spawn.pos.x + 12, spawn.pos.y - 16, {
                color: 'red',
                font: 0.5,
                align: 'center'
            });

    }


    const roleHandlers = {
        noble: roleСourtier,
        builder: roleBuilder,
        attacker: roleAttacker,
        healer: roleHealer,
        rat: roleRat,
        claimer: roleClaimer,
        driller: roleDriller,
        mover: roleMover,
        updater: roleUpdater,
        filler: roleFiller,
        invader: roleInvader,
        remoteMiner: roleRemoteMiner,
        remoteHauler: roleRemoteHauler,
        bobHarvester: roleBobHarvester,
        bobRepairer: roleBobRepairer,
        bobMover: roleBobMover,
        bobHelper: roleBobHelper,
        bobLocalMiner: roleBobLocalMiner,
        bobInvader: roleBobInvader,
        bobInvaderW24N56: roleBobInvaderW24N56,
        bobRemoteMiner: roleBobRemoteMiner,
        bobRemoteMinerW24N56: roleBobRemoteMinerW24N56,
        bobRemoteHauler: roleBobRemoteHauler,
        bobRemoteHaulerW24N56: roleBobRemoteHaulerW24N56,
        bobReserver: roleBobReserver,
        bobHealer: roleBobHealer,
        bobNanny: roleBobNanny,
        patrol: rolePatrol,
        mammyDefender: roleMammyDefender,
        mammyHealer: roleMammyHealer,
        mammyNanny: roleMammyNanny,
        mammyRemoteHauler: roleMammyRemoteHauler,
        mammyTauer: roleMammyTauer,
        mammyRanged: roleMammyRanged,
        steveUpdater: roleSteveUpdater,
        steveMiner: roleSteveMiner,
        steveMover: roleSteveMover,
        steveRepairer: roleSteveRepairer,
        steveInvader: roleSteveInvader,
        steveInvaderTwo: roleSteveInvaderTwo,
        steveInvaderTree: roleSteveInvaderTree,
        steveRemoteMiner: roleSteveRemoteMiner,
        steveRemoteHauler: roleSteveRemoteHauler,
        steveRemoteMinerTwo: roleRemoteMinerTwo,
        steveRemoteMinerTree: roleRemoteMinerTree,
        steveRemoteHaulerTwo: roleSteveRemoteHauler,
        steveReserver: roleSteveReserver,
        steveReserverTwo: roleSteveReserverTwo,
        steveSteveNanny: roleSteveNanny,
        steveSteveRanged: roleSteveRanged,
    };

    shutdownZone.update();

    for (let name in Game.creeps) {
        let creep = Game.creeps[name];

        if (creep.memory.role === 'mammyRemoteHauler' || creep.memory.role === 'bobRemoteHauler' || creep.memory.role === 'bobRemoteHaulerW24N56') {
            if (!creep.badge || creep.badge !== 'C-00109:NA:A') {
                creep.badge = 'C-00109:NA:A';
            }
        } else {
            if (creep.badge === 'C-00109:NA:A') {
                creep.badge = '';
            }
        }

        if (shutdownZone.handleCreep(creep)) {
            continue;
        }

        let handler = roleHandlers[creep.memory.role];
        if (handler) {
            if (typeof handler.run === 'function') {
                handler.run(creep);
            } else {
                console.log('⚠️ Обработчик роли "' + creep.memory.role + '" не имеет метода run. Крип: ' + name);
            }
        }

    }

// === Логика турелей ===
    for (let name in Game.structures) {
        let structure = Game.structures[name];
        if (structure.structureType === STRUCTURE_TOWER) {
            roleTower.run(structure);
        }
    }

// === Логика линков ===
    if (spawn && spawn.room) {
        const room = spawn.room;
        const sourceLink = room.lookForAt(LOOK_STRUCTURES, 29, 48).find(s => s.structureType === STRUCTURE_LINK);
        const targetLink = room.lookForAt(LOOK_STRUCTURES, 21, 18).find(s => s.structureType === STRUCTURE_LINK);

        if (sourceLink && targetLink && sourceLink.store[RESOURCE_ENERGY] > 0 && targetLink.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
            sourceLink.transferEnergy(targetLink);
        }
    }


// Логика спавна Bob — вызываем раз в тик
    spawnBobManager.tick();
// Логика спавна Steve — вызываем раз в тик
    spawnSteveManager.tick();
// Логика спавна Mammy — вызываем раз в тик
    roleManager.tick();

    if (!Memory.storageStats) Memory.storageStats = {};

    const PERIOD = 3000;

    for (let roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        if (!room || !room.storage) continue;

        const storage = room.storage;
        const id = storage.id;
        const currentBalance = storage.store[RESOURCE_ENERGY] || 0;

        if (!Memory.storageStats[id]) {
            Memory.storageStats[id] = {
                X: currentBalance,
                result: 0,
                put: 0,
                taken: 0,
                last: currentBalance,
                s: Math.floor(Game.time / PERIOD) * PERIOD
            };
        }

        const stat = Memory.storageStats[id];
        if (typeof stat.X !== 'number') stat.X = currentBalance;
        if (typeof stat.result !== 'number') stat.result = 0;
        if (typeof stat.put !== 'number') stat.put = 0;
        if (typeof stat.taken !== 'number') stat.taken = 0;
        if (typeof stat.last !== 'number') stat.last = currentBalance;
        if (typeof stat.s !== 'number') stat.s = Math.floor(Game.time / PERIOD) * PERIOD;

        const delta = currentBalance - stat.last;
        if (delta > 0) {
            stat.put += delta;
        } else if (delta < 0) {
            stat.taken += -delta;
        }
        stat.last = currentBalance;

        const elapsed = Game.time - stat.s ;

        if (elapsed >= PERIOD) {
            const Y = currentBalance;
            stat.result = stat.X - Y;
            stat.X = Y;
            stat.put = 0;
            stat.taken = 0;
            stat.s = Math.floor(Game.time / PERIOD) * PERIOD;
        }

        const nextUpdate = Math.max(0, PERIOD - (Game.time - stat.s));

        room.visual.text(`${stat.result >= 0 ? '-' : ''}${stat.result}`*(-1), storage.pos.x, storage.pos.y - 1.1, {align: 'center', font: 0.3, color: stat.result >= 0 ? '#ff0000' : '#00ff00'});
        room.visual.text(`${nextUpdate}`, storage.pos.x, storage.pos.y + 1.2, {align: 'center', font: 0.3, color: '#ffffff'});
        room.visual.text(`+${stat.put}`, storage.pos.x - 1.2, storage.pos.y + 0.1, {align: 'center', font: 0.3, color: '#00ff00'});
        room.visual.text(`-${stat.taken}`, storage.pos.x + 1.2, storage.pos.y + 0.1, {align: 'center', font: 0.3, color: '#ff0000'});

        function checkCPUUsage() {
            let totalCPU = 0;  // Переменная для хранения общей суммы CPU

            // Проходим по всем крипам
            for (let creepName in Game.creeps) {
                let creep = Game.creeps[creepName];

                // Сохраняем стартовое время
                const startCPU = Game.cpu.getUsed();

                // Пример действия: передвижение к ближайшему флагу
                const target = creep.pos.findClosestByRange(FIND_FLAGS);
                if (target) {
                    creep.moveTo(target);
                }

                // Рассчитываем использование CPU после действия
                const cpuUsed = Game.cpu.getUsed() - startCPU;

                // Если крип использует больше 0.0001 CPU, выводим его имя и использование CPU
                if (cpuUsed > 0.0001) {
                    console.log(`${creep.name}: ${cpuUsed.toFixed(5)} CPU`);
                    totalCPU += cpuUsed;  // Добавляем использованное CPU к общей сумме
                }
            }

            console.log(`⚡ Общее использование CPU всеми крипами: ${totalCPU.toFixed(5)} CPU`);

            // Общее использование CPU за тик
            console.log(`🟢 Общее использование CPU за тик: ${Game.cpu.getUsed().toFixed(5)} CPU`);
        }

        checkCPUUsage();
    }

}; // конец module.exports.loop

