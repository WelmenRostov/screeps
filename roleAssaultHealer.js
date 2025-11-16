const creepMovement = require('./creepMovement');

let roleAssaultHealer = {
    run: function(creep) {
        new RoomVisual(creep.room.name).text('💊', creep.pos.x, creep.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });

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

            let wounded = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
                filter: c => c.memory.assaultSquadId === squadId && c.hits < c.hitsMax
            });

            if (wounded) {
                let range = creep.pos.getRangeTo(wounded);
                if (range <= 1) {
                    creep.heal(wounded);
                } else if (range <= 3) {
                    creep.rangedHeal(wounded);
                    if (range > 2) {
                        creepMovement.moveTo(creep, wounded, { range: 1, reusePath: 2, visualizePathStyle: { stroke: '#00ff00' } });
                    }
                } else {
                    creepMovement.moveTo(creep, wounded, { range: 1, reusePath: 2, visualizePathStyle: { stroke: '#00ff00' } });
                }
                return;
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

                let rangeToMelee = creep.pos.getRangeTo(meleeCenter);
                if (rangeToMelee < 3) {
                    let dirs = [
                        [0, -1], [1, -1], [1, 0], [1, 1],
                        [0, 1], [-1, 1], [-1, 0], [-1, -1]
                    ];
                    let directions = [TOP, TOP_RIGHT, RIGHT, BOTTOM_RIGHT, BOTTOM, BOTTOM_LEFT, LEFT, TOP_LEFT];
                    for (let i = 0; i < directions.length; i++) {
                        let [dx, dy] = dirs[i];
                        let pos = new RoomPosition(creep.pos.x + dx, creep.pos.y + dy, creep.room.name);
                        let newRange = pos.getRangeTo(meleeCenter);
                        if (newRange >= 3 && newRange <= 5) {
                            creep.move(directions[i]);
                            return;
                        }
                    }
                } else if (rangeToMelee > 5) {
                    creepMovement.moveTo(creep, meleeCenter, { range: 3, reusePath: 5, visualizePathStyle: { stroke: '#00ff00' } });
                }
            }
        }
    }
};

module.exports = roleAssaultHealer;

