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

    this.capacityInBytes = NOT_GIVEN;       // C

    // Block info
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
        this.isValid = true;

        if (this.capacityInBytes === NOT_GIVEN) {
            this.isValid = false;
        }
        if (this.numOfBlocks === NOT_GIVEN && this.blockSizeInBytes === NOT_GIVEN) {
            this.isValid = false;
        }
        if (this.numOfSets === NOT_GIVEN && this.numOfWays === NOT_GIVEN) {
            this.isValid = false;
        }
        if (this.addressFormatLength === NOT_GIVEN && this.mainMemSizeInBytes === NOT_GIVEN) {
            this.isValid = false;
        }
        if (this.wordSizeInBytes === NOT_GIVEN) {
            this.isValid = false;
        }
        if (this.addressableUnitSizeInBytes === NOT_GIVEN) {
            this.isValid = false;
        }

        if (this.isValid) {
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
    };

    CacheModel.prototype.calculateBlocks = function() {
        if (this.numOfBlocks === NOT_GIVEN) {
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
}

// Update input bars according to values in model
function refillInputs() {
    // TODO inputs will also need to reflect unit dropdowns (or refresh to bytes?)
    document.getElementById("cacheCapacityInput").value = currentModel.capacityInBytes;
    document.getElementById("numOfBlocksInput").value = currentModel.numOfBlocks;
    document.getElementById("blockSizeInput").value = currentModel.blockSizeInBytes;
    document.getElementById("numOfWaysInput").value = currentModel.numOfWays;
    document.getElementById("numOfSetsInput").value = currentModel.numOfSets;
    document.getElementById("mainMemorySizeInput").value = currentModel.mainMemSizeInBytes;
    document.getElementById("addressBitsInput").value = currentModel.addressFormatLength;
    document.getElementById("wordSizeInput").value = currentModel.wordSizeInBytes;
}

function clearInputs() {
    document.getElementById("cacheCapacityInput").value = "";
    document.getElementById("numOfBlocksInput").value = "";
    document.getElementById("blockSizeInput").value = "";
    document.getElementById("numOfWaysInput").value = "";
    document.getElementById("numOfSetsInput").value = "";
    document.getElementById("mainMemorySizeInput").value = "";
    document.getElementById("addressBitsInput").value = "";
    document.getElementById("wordSizeInput").value = "";
}

// Generate label string for progress bar piece
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

// Adjust progress bar piece sizes and put on labels
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

function clearProgressBar() {
    document.getElementById("tagBits").innerText = "";
    document.getElementById("tagBits").style.width = "0%";

    document.getElementById("indexBits").innerText = "";
    document.getElementById("indexBits").style.width = "0%";

    document.getElementById("blockOffsetBits").innerText = "";
    document.getElementById("blockOffsetBits").style.width = "0%";

    document.getElementById("addrUnitBits").innerText = "";
    document.getElementById("addrUnitBits").style.width = "0%";
}

// Adressable unit dropdown methods
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

function clearEverything() {
    currentModel = new CacheModel();
    clearInputs();
    chooseByteAddressable();
    clearProgressBar();
    document.getElementById("lengthLabel").innerText = "Address format length: ";
}

// Render page if input is valid
function onModelButtonClicked() {
    currentModel = new CacheModel();

    // TODO add unit dropdowns to some inputs
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

    temp = document.getElementById("wordSizeInput").value;
    currentModel.wordSizeInBytes = temp === "" ? NOT_GIVEN : temp;

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
        document.getElementById("lengthLabel").innerText = "Address format length: ";
        clearProgressBar();
    }
}

function onClearButtonClicked() {
    clearEverything();
}

function onExampleButtonClicked() {
    clearEverything();

    document.getElementById("cacheCapacityInput").value = 1024;
    document.getElementById("blockSizeInput").value = 8;
    document.getElementById("numOfWaysInput").value = 4;
    document.getElementById("mainMemorySizeInput").value = 65536;
    document.getElementById("wordSizeInput").value = 4;
    chooseByteAddressable();
}