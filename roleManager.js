const {parametrCrepps, timeLife} = require('./variables');
const spawnModule = require('./spawnModule');

let spawn = (Game.spawns['MomDelta'] && !Game.spawns['MomDelta'].spawning)
    ? Game.spawns['MomDelta']
    : Game.spawns['Mammy'];

let roleManager = {
    tick: function() {

        /*const minRoles = { оптимал
            builder: 1,
            driller: 1,
            mover: 2,
            filler: 0,
            updater: 1,
            invader: 0,
            remoteMiner: 2,
            remoteHauler: 1,
        };*/

        const PATROL_POS = {x: 26, y: 24, roomName: 'W20N57'};

        const minRoles = {
            mammyNanny: 120,
            driller: 100,
            mover: 100,


            builder: 0,
            updater: 0,
            remoteHauler: 1200,

            //Болок захвата
            mammyHealer: 200, //1200 норм
            mammyTauer: 2500, //2500 норм
            mammyRanged: 600, //2200 норм
            mammyRemoteHauler: 0, //2500 норм
            mammyDefender: 0,
            rat: 0,


            /*
            mammyHealer: 1,
            filler: 0,
            invader: 0,
            remoteMiner: 0,
            remoteHauler: 1,
            patrol: 0,
            attacker: 1,
            mammyDefender: 0,
            mammyTauer: 2,
            mammyRanged: 1,
            mammyRemoteHauler: 2 //2500 норм
            */
        };

        const targetRoom = 'W22N56';
        const targetRoomAttaker = 'W23N56';
        let hasEnemies = false;
        let enemyRoom = null;
        if (Game.rooms[targetRoom]) {
            let enemies = Game.rooms[targetRoom].find(FIND_HOSTILE_CREEPS);
            if (enemies.length > 0) {
                hasEnemies = true;
                enemyRoom = targetRoom;
            }
        }

        const allCreeps = Object.values(Game.creeps);
        const roleSum = {
            builder: 0,
            driller: 0,
            mover: 0,
            filler: 0,
            updater: 0,
            invader: 0,
            remoteMiner: 0,
            remoteHauler: 0,
            attacker: 0,
            patrol: 0,
            mammyDefender: 0,
            mammyHealer: 0,
            mammyNanny: 0,
            mammyRemoteHauler: 0,
            mammyTauer: 0,
            mammyRanged: 0,
            rat: 0,
        };

        for (let c of allCreeps) {
            if (roleSum.hasOwnProperty(c.memory.role) && c.ticksToLive) {
                roleSum[c.memory.role] += c.ticksToLive;
            }
        }
        /*==============================================================================*/

        if (roleSum.mammyNanny < minRoles.mammyNanny  ){
            if (this.spawnMammyNanny() === OK) return;
        }

        let hasNanny = roleSum.mammyNanny >= minRoles.mammyNanny;

        if (hasNanny) {
            
            if (roleSum.driller < minRoles.driller  ){
                if (this.spawnDriller() === OK) return;
            }

            let hasDriller = roleSum.driller >= minRoles.driller;

            if (hasDriller) {

                if (roleSum.mover < minRoles.mover  ){
                    if (this.spawnMover() === OK) return;
                }
                let hasMover = roleSum.mover >= minRoles.mover;

                if (hasMover) {
                    if (roleSum.mammyHealer < minRoles.mammyHealer  ){
                        if (this.spawnMammyHealer() === OK) return;
                    }
                    if (roleSum.updater < minRoles.updater ){
                        if (this.spawnUpdater() === OK) return;
                    }

                    if (roleSum.builder < minRoles.builder ){
                        if (this.spawnBuilder() === OK) return;
                    }

                    let hasHealer = roleSum.mammyHealer >= minRoles.mammyHealer;


                    if (hasHealer) {
                        if (roleSum.mammyTauer < minRoles.mammyTauer  ){
                            if (this.spawnMammyTauer() === OK) return;
                        }
                        let hasTauer = roleSum.mammyTauer >= minRoles.mammyTauer;

                        if (hasTauer) {
                            if (roleSum.mammyRanged < minRoles.mammyRanged  ){
                                if (this.spawnMammyRanged() === OK) return;
                            }
                            let hasRanged = roleSum.mammyRanged >= minRoles.mammyRanged;

                            if (hasRanged) {

                                if (roleSum.mammyRemoteHauler < minRoles.mammyRemoteHauler ){
                                    if (this.spawnMammyRemoteHauler() === OK) return;
                                }

                                let hasRemoteHauler = roleSum.mammyRemoteHauler >= minRoles.mammyRemoteHauler;

                                if (roleSum.updater < minRoles.updater ){
                                    if (this.spawnUpdater() === OK) return;
                                }

                                if (roleSum.builder < minRoles.builder ){
                                    if (this.spawnBuilder() === OK) return;
                                }

                                if (hasRemoteHauler) {

                                    if (roleSum.remoteMiner < (minRoles.remoteMiner || 0) * 500  ){
                                        if (this.spawnRemoteMiner('W23N56') === OK) return;
                                    }
                                    if (roleSum.remoteHauler < (minRoles.remoteHauler || 0) * 1  ){
                                        if (this.spawnRemoteHauler('W23N56', {x: 29, y: 48, roomName: spawn.room.name}) === OK) return;
                                    }

                                    if (enemyRoom && roleSum.attacker === 0  ){
                                        if (spawnModule.spawnAttacker(enemyRoom) === OK) return;
                                    }

                                    const fillerSourceRoom = 'W23N56';
                                    const fillerTargetRoom = 'W23N56';

                                    if (roleSum.filler < (minRoles.filler || 0) * 100  ){
                                        if (this.spawnFiller(fillerSourceRoom, fillerTargetRoom) === OK) return;
                                    }
                                    if (roleSum.invader < (minRoles.invader || 0) * 10  ){
                                        if (this.spawnInvader() === OK) return;
                                    }
                                    if (roleSum.patrol < (minRoles.patrol || 0) * 600  ){
                                        if (this.spawnPatrol(PATROL_POS) === OK) return;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        /*------------------------------------------------------------------------------*/
    },

    spawnBuilder: function() {
        spawn = Game.spawns['Mammy']
        let body = [];

        body.push(...Array(10).fill(WORK));
        body.push(...Array(13).fill(MOVE));
        body.push(...Array(10).fill(CARRY));

        let homeRoom = spawn.room.name;
        let name = 'Builder_' + spawn.name + '_' + homeRoom + '_' + Game.time;
        let result = spawn.spawnCreep(parametrCrepps.base, name, { memory: { role: 'builder' } });
        if (result === ERR_NOT_ENOUGH_ENERGY) {
            spawn.spawnCreep(body, name, { memory: { role: 'builder' } });
        }
    },



    spawnDriller: function() {
        spawn = Game.spawns['Mammy']

        let body = [];
        body.push(...Array(15).fill(WORK));
        body.push(...Array(1).fill(MOVE));
        let homeRoom = spawn.room.name;
        let name = 'Driller_' + spawn.name + '_' + homeRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, { memory: { role: 'driller' } });
    },

    spawnMover: function() {
        spawn = Game.spawns['Mammy']

        let body = [];
        body.push(...Array(15).fill(MOVE));
        body.push(...Array(35).fill(CARRY));

        let homeRoom = spawn.room.name;
        let name = 'Mover_' + spawn.name + '_' + homeRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, { memory: { role: 'mover' } });
    },

    spawnFiller: function(sourceRoom, targetRoom) {
        spawn = Game.spawns['Mammy']
        let body = [
            MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
            CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,
        ];
        let name = 'Filler_' + spawn.name + '_' + targetRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, { memory: { role: 'filler', sourceRoom, targetRoom } });
    },

    spawnUpdater: function() {
        spawn = Game.spawns['Mammy']
        let body = [];
        body.push(...Array(10).fill(WORK));
        body.push(...Array(13).fill(MOVE));
        body.push(...Array(10).fill(CARRY));

        let homeRoom = spawn.room.name;
        let name = 'Updater_' + spawn.name + '_' + homeRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, { memory: { role: 'updater' } });
    },

    spawnInvader: function() {
        spawn = Game.spawns['Mammy']
        let body = [
            WORK,WORK,WORK,WORK,WORK,WORK,
            MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
            CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,
        ];
        let homeRoom = spawn.room.name;
        let name = 'Invader_' + spawn.name + '_' + homeRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, { memory: { role: 'invader', homeRoom: spawn.room.name } });
    },

    spawnRemoteMiner: function(targetRoom) {
        spawn = Game.spawns['Mammy']
        let body = [
            WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,
            MOVE,MOVE,MOVE,MOVE,
        ];
        let name = 'RemoteMiner_' + spawn.name + '_' + targetRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, { memory: { role: 'remoteMiner', targetRoom } });
    },

    spawnRemoteHauler: function(targetRoom, homeLinkPos) {
        spawn = Game.spawns['Mammy']
        let body = [];

        body.push(...Array(15).fill(MOVE));
        body.push(...Array(30).fill(CARRY));

        let name = 'RemoteHauler_' + spawn.name + '_' + targetRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, { memory: { role: 'remoteHauler', targetRoom, homeLinkPos } });
    },

    spawnPatrol: function(patrolPos) {
        return spawnModule.spawnPatrol(patrolPos);
    },

    spawnMammyDefender: function() {
        spawn = Game.spawns['Mammy']
        if (!spawn) return ERR_INVALID_TARGET;

        let body = [];

        body.push(...Array(15).fill(TOUGH));
        body.push(...Array(15).fill(MOVE));
        body.push(...Array(15).fill(ATTACK));

        let targetRoom = 'W23N56';
        let name = 'Defender_' + spawn.name + '_' + targetRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'mammyDefender',
                targetRoom: 'W24N56',
                homeRoom: spawn.room.name
            }
        });
    },

    spawnMammyHealer: function() {
        if (!spawn) return ERR_INVALID_TARGET;
        spawn = Game.spawns['MomDelta']
        let body = [];

        body.push(...Array(2).fill(TOUGH));
        body.push(...Array(14).fill(MOVE));
        body.push(...Array(14).fill(HEAL));

        let targetRoom = 'W24N56';
        let name = 'Healer_' + spawn.name + '_' + targetRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'mammyHealer',
                targetRoom: 'W24N56',
                homeRoom: spawn.room.name
            }
        });
    },

    spawnMammyRemoteHauler: function() {
        spawn = Game.spawns['Mammy']
        if (!spawn) return ERR_INVALID_TARGET;
        let body = [];

        body.push(...Array(15).fill(MOVE));
        body.push(...Array(30).fill(CARRY));

        let targetRoom = 'W24N56';
        let homeRoom = spawn.room.name;
        let name = 'RemoteHauler_' + spawn.name + '_' + targetRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'mammyRemoteHauler',
                targetRoom: targetRoom,
                homeRoom: homeRoom,
                decoration: 'C-00109:NA:A'
            }
        });
    },

    spawnMammyTauer: function() {
        spawn = Game.spawns['MomDelta']
        if (!spawn) return ERR_INVALID_TARGET;
        let body = [];

        body.push(...Array(15).fill(TOUGH));
        body.push(...Array(15).fill(MOVE));
        body.push(...Array(15).fill(ATTACK));

        let targetRoom = 'W24N56';
        let name = 'Tauer_' + spawn.name + '_' + targetRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'mammyTauer',
                targetRoom: targetRoom
            }
        });
    },

    spawnMammyRanged: function() {
        spawn = Game.spawns['MomDelta']
        if (!spawn) return ERR_INVALID_TARGET;

        let body = [];
        body.push(...Array(5).fill(TOUGH));
        body.push(...Array(25).fill(MOVE));
        body.push(...Array(20).fill(RANGED_ATTACK));

        let targetRoom = 'W24N56';
        let name = 'Ranged_' + spawn.name + '_' + targetRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'mammyRanged',
                targetRoom: targetRoom
            }
        });
    },

    spawnRat: function() {
        spawn = Game.spawns['Mammy']
        if (!spawn) return ERR_INVALID_TARGET;

        let body = [];
        body.push(...Array(20).fill(TOUGH));
        body.push(...Array(25).fill(MOVE));
        body.push(...Array(4).fill(RANGED_ATTACK));

        let targetRoom = 'W23N56';
        let name = 'Rat_' + spawn.name + '_' + 'W23N56' + '_' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'rat',
                targetRoom: targetRoom
            }
        });
    },

    spawnMammyNanny: function() {
        spawn = Game.spawns['Mammy']
        if (!spawn) return ERR_INVALID_TARGET;

        let body = [];
        body.push(...Array(15).fill(MOVE));
        body.push(...Array(35).fill(CARRY));

        let homeRoom = spawn.room.name;
        let name = 'Nanny_' + spawn.name + '_' + homeRoom + '_' + Game.time;
        return spawn.spawnCreep(body, name, {
            memory: {
                role: 'mammyNanny',
                homeRoom: homeRoom
            }
        });
    }
};

module.exports = roleManager;
