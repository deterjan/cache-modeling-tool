const NOT_GIVEN = -1;
const NOT_CALCULATED = -2;

var currentModel;
var addressableUnit = "Byte";

function log2(x) {
    return Math.ceil(Math.log(x) / Math.log(2));
}

function CacheModel() {
    // Whether info stored in model is valid
    this.isValid = false;

    // Block info
    this.capacityInBytes = NOT_GIVEN;       // C
    this.numOfBlocks = NOT_GIVEN;           // B
    this.blockSizeInBytes = NOT_GIVEN;      // b

    // Associativity info
    this.numOfWays = NOT_GIVEN;             // N
    this.numOfSets = NOT_GIVEN;             // S

    // Other architectural info
    this.mainMemSizeInBytes = NOT_GIVEN;    // main memory size in bytes
    this.addressFormatLength = NOT_GIVEN;   // number of bits required to address main memory

    this.wordSizeInBytes = NOT_GIVEN;       // processor word size in bytes

    // Equal to word size if cache is word addressable, (word size / 2) if half word addressable, 1 if byte addressable etc.
    this.addressableUnitSizeInBytes = NOT_GIVEN;

    // Fields in the address format used to access cache, in bits
    this.unitOffsetLength = NOT_CALCULATED;
    this.blockOffsetLength = NOT_CALCULATED;
    this.indexLength = NOT_CALCULATED;

    CacheModel.prototype.model = function() {
        var sufficientInfo = true;

        if (!this.checkBlocksDefined()) {
            sufficientInfo = false;
        }
        if (!this.checkSetsDefined()) {
            sufficientInfo = false;
        }
        if (this.wordSizeInBytes === NOT_GIVEN) {
            sufficientInfo = false;
        }
        if (this.addressFormatLength === NOT_GIVEN && this.mainMemSizeInBytes === NOT_GIVEN) {
            sufficientInfo = false;
        }

        if (sufficientInfo) {
            this.calculateBlocks();
            this.calculateSets();

            if (this.addressFormatLength === NOT_GIVEN) {
                this.addressFormatLength = log2(this.mainMemSizeInBytes / this.addressableUnitSizeInBytes);
            }
            else {
                this.mainMemSizeInBytes = Math.pow(2, this.addressFormatLength * this.addressableUnitSizeInBytes);
            }

            this.calculateAddressFormat();
        }

        this.isValid = sufficientInfo;
    };

    CacheModel.prototype.checkBlocksDefined = function() {
        var a = this.capacityInBytes !== NOT_GIVEN;
        var b = this.numOfBlocks !== NOT_GIVEN;
        var c = this.blockSizeInBytes !== NOT_GIVEN;
        return a && (b || c) || (b && c);
    };

    CacheModel.prototype.checkSetsDefined = function() {
        var a = this.numOfSets !== NOT_GIVEN;
        var b = this.numOfWays !== NOT_GIVEN;
        return a || b;
    };

    CacheModel.prototype.calculateBlocks = function() {
        if (this.capacityInBytes === NOT_GIVEN) {
            this.capacityInBytes = this.numOfBlocks * this.blockSizeInBytes;
        }
        else if (this.numOfBlocks === NOT_GIVEN) {
            this.numOfBlocks = this.capacityInBytes / this.blockSizeInBytes;
        }
        else {
            this.blockSizeInBytes = this.capacityInBytes / this.numOfBlocks;
        }
    };

    CacheModel.prototype.calculateSets = function() {
        if (this.numOfWays === NOT_GIVEN) {
            this.numOfWays = this.numOfBlocks / this.numOfSets;
        }
        else {
            this.numOfSets = this.numOfBlocks / this.numOfWays;
        }
    };

    CacheModel.prototype.calculateAddressFormat = function() {
        this.unitOffsetLength = log2(this.wordSizeInBytes / this.addressableUnitSizeInBytes);
        this.blockOffsetLength = log2(this.blockSizeInBytes / this.wordSizeInBytes);
        this.indexLength = log2(this.numOfBlocks / this.numOfWays);
        this.tagLength = this.addressFormatLength - this.unitOffsetLength -
            this.blockOffsetLength - this.indexLength;
    };

    CacheModel.prototype.testPrint = function () {
            console.log("cap in bytes: " + this.capacityInBytes);
            console.log("#blocks: " + this.numOfBlocks);
            console.log("blocksize in bytes: " + this.blockSizeInBytes);

            console.log("#sets: " + this.numOfSets);
            console.log("#ways: " + this.numOfWays);

            console.log("wordsize in bytes: " + this.wordSizeInBytes);

            console.log();
            console.log("length: " + this.addressFormatLength);
            console.log("unit offset " + this.unitOffsetLength);
            console.log("block offset: " + this.blockOffsetLength);
            console.log("index: " + this.indexLength);
            console.log("tag: " + this.tagLength);
    };

    CacheModel.prototype.reset = function () {
        this.isValid = false;
        this.capacityInBytes = NOT_GIVEN;
        this.numOfBlocks = NOT_GIVEN;
        this.blockSizeInBytes = NOT_GIVEN;
        this.numOfWays = NOT_GIVEN;
        this.numOfSets = NOT_GIVEN;
        this.mainMemSizeInBytes = NOT_GIVEN;
        this.addressFormatLength = NOT_GIVEN;
        this.wordSizeInBytes = NOT_GIVEN;
        this.addressableUnitSizeInBytes = NOT_GIVEN;
        this.unitOffsetLength = NOT_CALCULATED;
        this.blockOffsetLength = NOT_CALCULATED;
        this.indexLength = NOT_CALCULATED;
    };
}

function refillInputs() {
    // TODO these will also need to reflect byte unit dropdowns (or refresh to bytes?)
    document.getElementById("cacheCapacityInput").value = currentModel.capacityInBytes;
    document.getElementById("numOfBlocksInput").value = currentModel.numOfBlocks;
    document.getElementById("blockSizeInput").value = currentModel.blockSizeInBytes;
    document.getElementById("numOfWaysInput").value = currentModel.numOfWays;
    document.getElementById("numOfSetsInput").value = currentModel.numOfSets;
    document.getElementById("mainMemorySizeInput").value = currentModel.mainMemSizeInBytes;
    document.getElementById("addressBitsInput").value = currentModel.addressFormatLength;
    document.getElementById("wordSizeInput").value = currentModel.wordSizeInBytes;
}

function makeProgressBarLabel(name, length) {
    if (length <= 0)
        return "";

    var label = name + ": " + length;
    if (length > 1)
        label = label + " bits";
    else
        label = label + " bit";

    return label;
}

function mapBitsToProgressBar() {
    var unitOffsetPercent = 100 * currentModel.unitOffsetLength / currentModel.addressFormatLength;
    if (unitOffsetPercent < 15 && unitOffsetPercent !== 0)
        unitOffsetPercent = 15;

    var blockOffsetPercent = 100 * currentModel.blockOffsetLength / currentModel.addressFormatLength;
    if (blockOffsetPercent < 15 && blockOffsetPercent !== 0)
        blockOffsetPercent = 15;

    var indexPercent = (100 - unitOffsetPercent - blockOffsetPercent) * currentModel.indexLength /
        (currentModel.addressFormatLength - currentModel.unitOffsetLength - currentModel.blockOffsetLength);
    if (indexPercent < 15 && indexPercent !== 0)
        indexPercent = 15;

    var tagPercent = 100 - unitOffsetPercent - blockOffsetPercent - indexPercent;

    document.getElementById("tagBits").innerText = makeProgressBarLabel("Tag", currentModel.tagLength);
    document.getElementById("tagBits").style.width = tagPercent + "%";

    document.getElementById("indexBits").innerText = makeProgressBarLabel("Index", currentModel.indexLength);
    document.getElementById("indexBits").style.width = indexPercent + "%";

    document.getElementById("blockOffsetBits").innerText = makeProgressBarLabel("Block Offset", currentModel.blockOffsetLength);
    document.getElementById("blockOffsetBits").style.width = blockOffsetPercent + "%";

    document.getElementById("addrUnitBits").innerText = makeProgressBarLabel(addressableUnit + " Offset", currentModel.unitOffsetLength);
    document.getElementById("addrUnitBits").style.width = unitOffsetPercent + "%";
}

function chooseByteAddressable() {
    addressableUnit = "Byte";

    document.getElementById("byteAddr").classList.add("active");
    document.getElementById("wordAddr").classList.remove("active");
    document.getElementById("hwAddr").classList.remove("active");
}

function chooseHalfwordAddressable() {
    addressableUnit = "Halfword";

    document.getElementById("byteAddr").classList.remove("active");
    document.getElementById("wordAddr").classList.remove("active");
    document.getElementById("hwAddr").classList.add("active");
}

function chooseWordAddressable() {
    addressableUnit = "Word";

    document.getElementById("byteAddr").classList.remove("active");
    document.getElementById("wordAddr").classList.add("active");
    document.getElementById("hwAddr").classList.remove("active");
}

function onModelButtonClicked() {
    currentModel = new CacheModel();

    // TODO add byte unit dropdowns to some inputs
    var temp = document.getElementById("cacheCapacityInput").value;
    currentModel.capacityInBytes = temp === "" ? NOT_GIVEN : temp;
    temp = document.getElementById("numOfBlocksInput").value;
    currentModel.numOfBlocks = temp === "" ? NOT_GIVEN : temp;
    temp = document.getElementById("blockSizeInput").value;
    currentModel.blockSizeInBytes = temp === "" ? NOT_GIVEN : temp;

    temp = document.getElementById("numOfWaysInput").value;
    currentModel.numOfWays = temp === "" ? NOT_GIVEN : temp;
    temp = document.getElementById("numOfSetsInput").value;
    currentModel.numOfSets = temp === "" ? NOT_GIVEN : temp;

    temp = document.getElementById("mainMemorySizeInput").value;
    currentModel.mainMemSizeInBytes = temp === "" ? NOT_GIVEN : temp;
    temp = document.getElementById("addressBitsInput").value;
    currentModel.addressFormatLength = temp === "" ? NOT_GIVEN : temp;

    currentModel.wordSizeInBytes = document.getElementById("wordSizeInput").value;

    if (addressableUnit === "Halfword")
        currentModel.addressableUnitSizeInBytes = currentModel.wordSizeInBytes / 2;
    else if (addressableUnit === "Word")
        currentModel.addressableUnitSizeInBytes = currentModel.wordSizeInBytes;
    else
        currentModel.addressableUnitSizeInBytes = 1;

    currentModel.model();

    if (currentModel.isValid) {
        refillInputs();
        document.getElementById("lengthLabel").innerText = "Address format length: " + currentModel.addressFormatLength;
        mapBitsToProgressBar();
    }
    else {
        // TODO ensure validity of result (Check for minus values?)
        alert("Invalid parameters");
    }

    currentModel.reset();
}