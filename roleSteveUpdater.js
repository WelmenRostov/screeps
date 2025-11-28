let roleSteveUpdater = {
    /** @param {Creep} creep **/
    run: function(creep) {

        const targetPos = new RoomPosition(42, 42, creep.room.name);

        // Если крип пуст — он должен сначала идти за энергией
        if (creep.store[RESOURCE_ENERGY] === 0) {

            // Идем в целевую точку только если ещё не пришли
            if (!creep.pos.isEqualTo(targetPos)) {
                creep.moveTo(targetPos);
                return;
            }

            const storage = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_STORAGE
            });

            if (storage) {
                if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(storage);
                }
            }

            return;
        }

        // Если есть энергия — идем апгрейдить контроллер
        const controller = creep.room.controller;

        if (controller) {
            if (creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
                creep.moveTo(controller);
            }
        }
    }
};

module.exports = roleSteveUpdater;
