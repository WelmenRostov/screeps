const creepMovement = require('./creepMovement');

let roleAssaultRanged = {
    run: function(creep) {
        new RoomVisual(creep.room.name).text('🏹', creep.pos.x, creep.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });

        let squad = Memory.assaultSquad;
        let squadId = creep.memory.assaultSquadId;

        if (!squad || squad.squadId !== squadId) {
            return;
        }

        if (squad.state === 'spawning' || squad.state === 'moving') {
            if (!creep.memory.route) {
                creep.memory.route = squad.route.slice();
            }
            let route = creep.memory.route;
            
            while (route.length > 0 && creep.room.name === route[0]) {
                route.shift();
                creep.memory.route = route;
            }
            
            if (route.length > 0) {
                let nextRoom = route[0];
                let pos = new RoomPosition(25, 25, nextRoom);
                creepMovement.moveTo(creep, pos, { reusePath: 20, visualizePathStyle: { stroke: '#ff00ff' } });
                return;
            }

            let assemblyRoom = squad.route[squad.route.length - 1];
            if (creep.room.name === assemblyRoom) {
                let assemblyCenter = new RoomPosition(25, 25, assemblyRoom);
                if (creep.pos.getRangeTo(assemblyCenter) > 10) {
                    creepMovement.moveTo(creep, assemblyCenter, { reusePath: 10, visualizePathStyle: { stroke: '#ffff00' } });
                    return;
                }
            }
            return;
        }

        if (squad.state === 'attacking') {
            if (!creep.memory.route) {
                creep.memory.route = squad.route.slice();
            }
            let route = creep.memory.route;
            
            while (route.length > 0 && creep.room.name === route[0]) {
                route.shift();
                creep.memory.route = route;
            }
            
            if (route.length > 0) {
                let nextRoom = route[0];
                let pos = new RoomPosition(25, 25, nextRoom);
                creepMovement.moveTo(creep, pos, { reusePath: 20, visualizePathStyle: { stroke: '#ff00ff' } });
                return;
            }

            if (creep.room.name !== squad.targetRoom) {
                let pos = new RoomPosition(25, 25, squad.targetRoom);
                creepMovement.moveTo(creep, pos, { reusePath: 20, visualizePathStyle: { stroke: '#ff0000' } });
                return;
            }

            let melees = creep.room.find(FIND_MY_CREEPS, {
                filter: c => c.memory.assaultSquadId === squadId && c.memory.role === 'assaultMelee'
            });

            if (melees.length > 0) {
                let meleeCenter = melees[0].pos;
                if (melees.length > 1) {
                    let centerX = 0;
                    let centerY = 0;
                    for (let melee of melees) {
                        centerX += melee.pos.x;
                        centerY += melee.pos.y;
                    }
                    centerX = Math.floor(centerX / melees.length);
                    centerY = Math.floor(centerY / melees.length);
                    meleeCenter = new RoomPosition(centerX, centerY, creep.room.name);
                }

                let rangeToMelee = creep.pos.getRangeTo(meleeCenter);
                if (rangeToMelee > 5) {
                    creepMovement.moveTo(creep, meleeCenter, { range: 3, reusePath: 5, visualizePathStyle: { stroke: '#00ff00' } });
                }
            }

            let nearbyHostileCreeps = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
            if (nearbyHostileCreeps.length > 0) {
                let target = creep.pos.findClosestByRange(nearbyHostileCreeps);
                if (target) {
                    if (creep.rangedAttack(target) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, target, { range: 3, reusePath: 5, visualizePathStyle: { stroke: '#ff0000' } });
                    }
                    return;
                }
            }

            let towers = creep.room.find(FIND_HOSTILE_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_TOWER
            });

            if (towers.length > 0) {
                let targetTower = creep.pos.findClosestByRange(towers);
                if (targetTower) {
                    let range = creep.pos.getRangeTo(targetTower);
                    if (range <= 3) {
                        creep.rangedAttack(targetTower);
                    } else {
                        creepMovement.moveTo(creep, targetTower, { range: 3, reusePath: 10, visualizePathStyle: { stroke: '#ff8800' } });
                    }
                    return;
                }
            }

            if (melees.length > 0) {
                let meleeCenter = melees[0].pos;
                if (melees.length > 1) {
                    let centerX = 0;
                    let centerY = 0;
                    for (let melee of melees) {
                        centerX += melee.pos.x;
                        centerY += melee.pos.y;
                    }
                    centerX = Math.floor(centerX / melees.length);
                    centerY = Math.floor(centerY / melees.length);
                    meleeCenter = new RoomPosition(centerX, centerY, creep.room.name);
                }
                creepMovement.moveTo(creep, meleeCenter, { range: 3, reusePath: 5, visualizePathStyle: { stroke: '#00ff00' } });
            }
        }
    }
};

module.exports = roleAssaultRanged;

