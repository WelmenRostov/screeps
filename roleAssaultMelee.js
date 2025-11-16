const creepMovement = require('./creepMovement');

let roleAssaultMelee = {
    run: function(creep) {
        new RoomVisual(creep.room.name).text('⚔️', creep.pos.x, creep.pos.y - 0.55, { align: 'center', font: 0.5, opacity: 1 });

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

            let towers = creep.room.find(FIND_HOSTILE_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_TOWER
            });

            if (towers.length > 0) {
                let targetTower = creep.pos.findClosestByPath(towers);
                if (targetTower) {
                    let path = PathFinder.search(creep.pos, { pos: targetTower.pos, range: 1 }, {
                        roomCallback: function(roomName) {
                            if (roomName !== squad.targetRoom) return false;
                            let room = Game.rooms[roomName];
                            if (!room) return false;
                            let costs = new PathFinder.CostMatrix();
                            room.find(FIND_STRUCTURES).forEach(function(struct) {
                                if (struct.structureType === STRUCTURE_ROAD) {
                                    costs.set(struct.pos.x, struct.pos.y, 1);
                                } else if (struct.structureType !== STRUCTURE_CONTAINER && 
                                          (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {
                                    costs.set(struct.pos.x, struct.pos.y, 0xff);
                                }
                            });
                            return costs;
                        }
                    });

                    if (path.path.length > 0) {
                        let nextPos = path.path[0];
                        let structures = nextPos.lookFor(LOOK_STRUCTURES);
                        let blockingStructure = structures.find(s => 
                            s.structureType !== STRUCTURE_ROAD && 
                            s.structureType !== STRUCTURE_CONTAINER &&
                            (s.structureType !== STRUCTURE_RAMPART || !s.my)
                        );

                        if (blockingStructure) {
                            if (creep.dismantle(blockingStructure) === ERR_NOT_IN_RANGE) {
                                creepMovement.moveTo(creep, blockingStructure, { reusePath: 2, visualizePathStyle: { stroke: '#ff8800' } });
                            }
                            return;
                        }

                        let moveDir = creep.pos.getDirectionTo(nextPos);
                        creep.move(moveDir);
                        return;
                    }
                }
            }

            let hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS);
            if (hostileCreeps.length > 0) {
                let target = creep.pos.findClosestByPath(hostileCreeps);
                if (target) {
                    if (creep.attack(target) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, target, { reusePath: 10, visualizePathStyle: { stroke: '#ff0000' } });
                    }
                    return;
                }
            }

            let hostileStructures = creep.room.find(FIND_HOSTILE_STRUCTURES);
            if (hostileStructures.length > 0) {
                let target = creep.pos.findClosestByPath(hostileStructures);
                if (target) {
                    if (creep.attack(target) === ERR_NOT_IN_RANGE) {
                        creepMovement.moveTo(creep, target, { reusePath: 10, visualizePathStyle: { stroke: '#ff0000' } });
                    }
                    return;
                }
            }
        }
    }
};

module.exports = roleAssaultMelee;

