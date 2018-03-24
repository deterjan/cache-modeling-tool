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

// BEWARE TESTS LURK DOWN BELOW

function assert(cond, msg) {
    if (!cond) {
        throw new Error(msg);
    }
}

function test() {
    console.log("Testing...");

    /*
    Question 1 (Prob Set #7 Spring 2013) Modeling cache and tracing memory reference string

    A parallel multiprocessor has many 64-bit processors,
    and the maximum amount of byte-addressable memory is 4 TBytes.
    As part of the memory hierarchy, each processor has its own local L1 cache for data
    and for instructions. Each L1 cache is 32 KB, 2-way set associative,
    with LRU replacement policy, and block size of 2 words.
     */
    var model1 = new CacheModel();

    model1.wordSizeInBytes = (64 / 8);
    model1.addressableUnitSizeInBytes = 1;
    model1.mainMemSizeInBytes = 4 * Math.pow(2, 40);
    model1.capacityInBytes = 32 * Math.pow(2, 10);
    model1.numOfWays = 2;
    model1.blockSizeInBytes = model1.wordSizeInBytes * 2;

    model1.model();

    assert(model1.addressFormatLength === 42, "model1 length failed");
    assert(model1.unitOffsetLength === 3, "model1 byte offset failed");
    assert(model1.blockOffsetLength === 1, "model1 block offset failed");
    assert(model1.indexLength === 10, "model1 block offset failed");
    assert(model1.tagLength === 28, "model1 tag failed");

    /*
    Question 4 (Final Retake Fall 2013): Cache Memory: Modeling and Tracing

    In a memory system like MIPS (word size is 32 bits, and using 32 bits for addressing memory)
    assume a direct-mapped cache memory of size 128 bytes.
    Block size is given as 4-words. A word is 32 bits.
     */
    var model2 = new CacheModel();

    model2.wordSizeInBytes = (32 / 8);
    model2.addressableUnitSizeInBytes = 1;
    model2.addressFormatLength = 32;
    model2.capacityInBytes = 128;
    model2.numOfWays = 1;
    model2.blockSizeInBytes = model2.wordSizeInBytes * 4;

    model2.model();

    assert(model2.addressFormatLength === 32, "model2 length failed");
    assert(model2.unitOffsetLength === 2, "model2 byte offset failed");
    assert(model2.blockOffsetLength === 2, "model2 block offset failed");
    assert(model2.indexLength === 3, "model2 block offset failed");
    assert(model2.tagLength === 25, "model2 tag failed");

    /*
    Question 4 (Final Exam Spring 2014): Cache Memory: Modeling and Tracing

    In this question, memory is byte-addressable.
    Memory size is 1 GB.  Cache size is 4096 Bytes.
    Word size is 16 bits. Block size is 8 words.
    Cache is 4-way set associative.
     */
    var model3 = new CacheModel();

    model3.wordSizeInBytes = (16 / 8);
    model3.addressableUnitSizeInBytes = 1;
    model3.mainMemSizeInBytes = Math.pow(2, 30);
    model3.capacityInBytes = 4096;
    model3.numOfWays = 4;
    model3.blockSizeInBytes = model3.wordSizeInBytes * 8;

    model3.model();

    assert(model3.addressFormatLength === 30, "model3 length failed");
    assert(model3.unitOffsetLength === 1, "model3 byte offset failed");
    assert(model3.blockOffsetLength === 3, "model3 block offset failed");
    assert(model3.indexLength === 6, "model3 block offset failed");
    assert(model3.tagLength === 20, "model3 tag failed");

    /*
    Question 4 (MT #2 Spring 2014): Cache Memory: Modeling and Tracing

    In this question, memory is word-addressable (not byte-addressable, like MIPS).
    Memory size is 256 MB.  Cache size is 256 Bytes.
    Word size is 64 bits. Block size is 4 words. Cache is direct mapped.
     */
    var model4 = new CacheModel();

    model4.wordSizeInBytes = (64 / 8);
    model4.addressableUnitSizeInBytes = model4.wordSizeInBytes;
    model4.mainMemSizeInBytes = 256 * Math.pow(2, 20);
    model4.capacityInBytes = 256;
    model4.numOfWays = 1;
    model4.blockSizeInBytes = 4 * model4.wordSizeInBytes;

    model4.model();


    assert(model4.addressFormatLength === 25, "model4 length failed");
    assert(model4.unitOffsetLength === 0, "model4 byte offset failed");
    assert(model4.blockOffsetLength === 2, "model4 block offset failed");
    assert(model4.indexLength === 3, "model4 block offset failed");
    assert(model4.tagLength === 20, "model4 tag failed");


    /*
    Question 3 (Final Retake Spring 2015): Cache Modeling

    A computer has a 4-way set associative 1KB cache with a block size of 64 bits.
    Assume that the main memory is a byte-addressable 64KB memory.
    Explain the address format used to access this cache in a MIPS-like 32-bit processor.
     */
    var model5 = new CacheModel();

    model5.wordSizeInBytes = (32 / 8);
    model5.addressableUnitSizeInBytes = 1;
    model5.mainMemSizeInBytes = 64 * Math.pow(2, 10);
    model5.capacityInBytes = Math.pow(2, 10);
    model5.numOfWays = 4;
    model5.blockSizeInBytes = (64 / 8);

    model5.model();

    assert(model5.addressFormatLength === 16, "model5 length failed");
    assert(model5.unitOffsetLength === 2, "model5 byte offset failed");
    assert(model5.blockOffsetLength === 1, "model5 block offset failed");
    assert(model5.indexLength === 5, "model5 block offset failed");
    assert(model5.tagLength === 8, "model5 tag failed");

    /*
    Question 3a (Final Exam Spring 2015): Cache Modeling and Performance

    a) A computer has a cache of 64KB with a block size of 64 Bytes.
    Assume that the main memory is a byte-addressable 16MB memory.
    i) If the cache is directed mapped, what is the address format used to access this cache?
    ii) If the cache is 2-way associative, what is the address format? Explain.
    iii) How would the results to parts i and ii change if block size is 32 Bytes?
     */

    // i)
    var model6 = new CacheModel();

    model6.wordSizeInBytes = (32 / 8);
    model6.addressableUnitSizeInBytes = 1;
    model6.mainMemSizeInBytes = 16 * Math.pow(2, 20);
    model6.capacityInBytes = 64 * Math.pow(2, 10);
    model6.numOfWays = 1;
    model6.blockSizeInBytes = 64;

    model6.model();

    assert(model6.addressFormatLength === 24, "model6 length failed");
    assert(model6.unitOffsetLength === 2, "model6 byte offset failed");
    assert(model6.blockOffsetLength === 4, "model6 block offset failed");
    assert(model6.indexLength === 10, "model6 block offset failed");
    assert(model6.tagLength === 8, "model6 tag failed");

    // ii)
    var model7 = new CacheModel();

    model7.wordSizeInBytes = (32 / 8);
    model7.addressableUnitSizeInBytes = 1;
    model7.mainMemSizeInBytes = 16 * Math.pow(2, 20);
    model7.capacityInBytes = 64 * Math.pow(2, 10);
    model7.numOfWays = 2;
    model7.blockSizeInBytes = 64;

    model7.model();

    assert(model7.addressFormatLength === 24, "model7 length failed");
    assert(model7.unitOffsetLength === 2, "model7 byte offset failed");
    assert(model7.blockOffsetLength === 4, "model7 block offset failed");
    assert(model7.indexLength === 9, "model7 block offset failed");
    assert(model7.tagLength === 9, "model7 tag failed");

    // iii)
    model6.blockSizeInBytes = 32;
    model6.numOfBlocks = NOT_GIVEN;

    model6.model();

    assert(model6.addressFormatLength === 24, "model6iii length failed");
    assert(model6.unitOffsetLength === 2, "model6iii byte offset failed");
    assert(model6.blockOffsetLength === 3, "model6iii block offset failed");
    assert(model6.indexLength === 11, "model6iii block offset failed");
    assert(model6.tagLength === 8, "model6iii tag failed");

    model7.blockSizeInBytes = 32;
    model7.numOfBlocks = NOT_GIVEN;

    model7.model();

    assert(model7.addressFormatLength === 24, "model7iii length failed");
    assert(model7.unitOffsetLength === 2, "model7iii byte offset failed");
    assert(model7.blockOffsetLength === 3, "model7iii block offset failed");
    assert(model7.indexLength === 10, "model7iii block offset failed");
    assert(model7.tagLength === 9, "model7iii tag failed");

    /*
    Question 4 (MT #2 Spring 2015): Cache Modeling and Tracing

    a)	Consider a 4 GB byte-addressable main memory with a four-way set-associative
        cache of 2 MB and 32 bytes per block. (4 bytes per word)

        2. Show how the main memory address is partitioned into fields for the cache
        access and give the bit lengths of those fields.
    */
    var model8 = new CacheModel();

    model8.wordSizeInBytes = (32 / 8);
    model8.addressableUnitSizeInBytes = 1;
    model8.mainMemSizeInBytes = 4 * Math.pow(2, 30);
    model8.capacityInBytes = 2 * Math.pow(2, 20);
    model8.numOfWays = 4;
    model8.blockSizeInBytes = 32;

    model8.model();

    assert(model8.addressFormatLength === 32, "model8 length failed");
    assert(model8.unitOffsetLength === 2, "model8 byte offset failed");
    assert(model8.blockOffsetLength === 3, "model8 block offset failed");
    assert(model8.indexLength === 14, "model8 block offset failed");
    assert(model8.tagLength === 13, "model8 tag failed");

    /*
    Question 2 (Quiz #5 Fall 2015) Understanding cache organization and structure

    For a 32-bit processor with 4GB address space, connected to a 16KB 4-way
    set-associative cache with 2048 blocks in the cache, with each block containing
    Valid, and 2 LRU bits, plus Tag and Data, find the following: (byte-addressable)

        c)	the number of tag bits in the Tag field of the memory address
     */
    var model9 = new CacheModel();

    model9.wordSizeInBytes = (32 / 8);
    model9.addressableUnitSizeInBytes = 1;
    model9.mainMemSizeInBytes = 4 * Math.pow(2, 30);
    model9.capacityInBytes = 16 * Math.pow(2, 10);
    model9.numOfWays = 4;
    model9.numOfBlocks = 2048;

    model9.model();

    assert(model9.addressFormatLength === 32, "model9 length failed");
    assert(model9.unitOffsetLength === 2, "model9 byte offset failed");
    assert(model9.blockOffsetLength === 1, "model9 block offset failed");
    assert(model9.indexLength === 9, "model9 block offset failed");
    assert(model9.tagLength === 20, "model9 tag failed");

    /*
    Question 1 (Quiz #5 Fall 2015) 2-way set associative cache: modeling and tracing

    Consider a byte-addressed memory, of size 64K bytes. The 2-way set-associate
    cache size is 2K bytes. For this system, word size is 8 bytes, and block size is 8 words.

        a)	Draw the address format, including all fields, with names and widths.
     */
    var model10 = new CacheModel();

    model10.wordSizeInBytes = 8;
    model10.addressableUnitSizeInBytes = 1;
    model10.mainMemSizeInBytes = 64 * Math.pow(2, 10);
    model10.capacityInBytes = 2 * Math.pow(2, 10);
    model10.numOfWays = 2;
    model10.blockSizeInBytes = model10.wordSizeInBytes * 8;

    model10.model();

    assert(model10.addressFormatLength === 16, "model10 length failed");
    assert(model10.unitOffsetLength === 3, "model10 byte offset failed");
    assert(model10.blockOffsetLength === 3, "model10 block offset failed");
    assert(model10.indexLength === 4, "model10 block offset failed");
    assert(model10.tagLength === 6, "model10 tag failed");

    /*
    Question 4 (MT #2 Fall 2015) Cache modeling and tracing

    Part 1 For a 16-bit processor with 1GB address space, connected to a 64KB
    8-way set-associative cache with 4096 blocks in the cache, find the following:
     */
    var model11 = new CacheModel();

    model11.wordSizeInBytes = 2;
    model11.addressableUnitSizeInBytes = 1;
    model11.mainMemSizeInBytes = Math.pow(2, 30);
    model11.capacityInBytes = 64 * Math.pow(2, 10);
    model11.numOfWays = 8;
    model11.numOfBlocks = 4096;

    model11.model();

    assert(model11.addressFormatLength === 30, "model11 length failed");
    assert(model11.unitOffsetLength === 1, "model11 byte offset failed");
    assert(model11.blockOffsetLength === 3, "model11 block offset failed");
    assert(model11.indexLength === 9, "model11 block offset failed");
    assert(model11.tagLength === 17, "model11 tag failed");

    /*
    Question 4 (MT #2 Spring 2016) Cache modeling and tracing

    Part 1 An embedded 16-bit processor has 32 Mbytes of main memory, 32 Kbytes of cache, and no hard drive.
    Memory is byte-addressable.  The cache is 8-way set associative, with block size of 8 words.

        a) Draw the address format, naming all fields and give the widths in bits.
     */
    var model12 = new CacheModel();

    model12.wordSizeInBytes = 2;
    model12.addressableUnitSizeInBytes = 1;
    model12.mainMemSizeInBytes = 32 * Math.pow(2, 20);
    model12.capacityInBytes = 32 * Math.pow(2, 10);
    model12.numOfWays = 8;
    model12.blockSizeInBytes = 8 * model11.wordSizeInBytes;

    model12.model();

    assert(model12.addressFormatLength === 25, "model12 length failed");
    assert(model12.unitOffsetLength === 1, "model12 byte offset failed");
    assert(model12.blockOffsetLength === 3, "model12 block offset failed");
    assert(model12.indexLength === 8, "model12 block offset failed");
    assert(model12.tagLength === 13, "model12 tag failed");

    /*
    Question 4 (Retake Spring 2016) Cache Modeling

        a)	A word-addressable computer has a 2-way set associative 1KB cache with a block size of 64 bits.
        Assume that the main memory is a 256KB memory.
        Explain the address format used to access this cache in a 16-bit processor.

        (WRONG IN SOLUTION IN SOLVED PROBLEMS DOCUMENT;
         words are given as 2 bytes, but the format length calculation is done as if they are 4 bytes)
     */
    var model13 = new CacheModel();

    model13.wordSizeInBytes = 2;
    model13.addressableUnitSizeInBytes = model13.wordSizeInBytes;
    model13.mainMemSizeInBytes = 256 * Math.pow(2, 10);
    model13.capacityInBytes = Math.pow(2, 10);
    model13.numOfWays = 2;
    model13.blockSizeInBytes = (64 / 8);

    model13.model();

    assert(model13.addressFormatLength === 17, "model13 length failed");
    assert(model13.unitOffsetLength === 0, "model13 byte offset failed");
    assert(model13.blockOffsetLength === 2, "model13 block offset failed");
    assert(model13.indexLength === 6, "model13 block offset failed");
    assert(model13.tagLength === 9, "model13 tag failed");

    console.log("All tests passed!");
}