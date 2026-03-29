import Text "mo:core/Text";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import Time "mo:core/Time";

actor {

  // ──────────────────────────────────────────────────────
  // User types
  // ──────────────────────────────────────────────────────
  public type UserRole = { #admin; #staff; #driver };

  type AppUser = {
    id : Nat;
    username : Text;
    pin : Text;
    name : Text;
    role : UserRole;
    createdAt : Time.Time;
  };

  // ──────────────────────────────────────────────────────
  // Domain types
  // ──────────────────────────────────────────────────────
  type CustomerId = Nat;
  type EntryId = Nat;
  type VehicleId = Nat;

  type ItemType = { #husk; #dry; #wet; #both; #motta; #others };
  type CoconutType = { #rasi; #tallu; #others };
  type PaymentStatus = { #paid; #pending };

  type Customer = {
    id : CustomerId;
    name : Text;
    phone : Text;
    location : Text;
    createdAt : Time.Time;
  };

  type CustomerInput = { name : Text; phone : Text; location : Text };

  type Vehicle = {
    id : VehicleId;
    vehicleNumber : Text;
    usageCount : Nat;
    lastUsed : Time.Time;
  };

  type Note = {
    id : Nat;
    content : Text;
    createdAt : Time.Time;
    createdBy : Principal;
  };

  type HuskItem = { itemType : ItemType; quantity : Nat };

  type CoconutItem = {
    coconutType : CoconutType;
    specifyType : Text;
    quantity : Nat;
  };

  // ──────────────────────────────────────────────────────
  // Legacy types (kept for stable variable compatibility)
  // ──────────────────────────────────────────────────────
  type LegacyUserRole = { #admin; #user; #guest };
  type LegacyAccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, LegacyUserRole>;
  };

  type LegacyUserProfile = { name : Text };

  type LegacyHuskEntry = {
    id : EntryId;
    customerId : CustomerId;
    customerName : Text;
    itemType : ItemType;
    quantity : Nat;
    vehicleNumber : Text;
    notes : Text;
    createdAt : Time.Time;
    createdBy : Principal;
    createdByName : Text;
  };

  type LegacyCoconutEntry = {
    id : EntryId;
    customerId : CustomerId;
    customerName : Text;
    coconutType : CoconutType;
    specifyType : Text;
    quantity : Nat;
    vehicleNumber : Text;
    notes : Text;
    createdAt : Time.Time;
    createdBy : Principal;
    createdByName : Text;
  };

  // V1 types kept for huskBatchEntries / coconutBatchEntries migration
  type HuskBatchEntryV1 = {
    id : EntryId;
    customerId : CustomerId;
    customerName : Text;
    items : [HuskItem];
    vehicleNumber : Text;
    notes : Text;
    createdAt : Time.Time;
    createdBy : Principal;
    createdByName : Text;
  };

  type CoconutBatchEntryV1 = {
    id : EntryId;
    customerId : CustomerId;
    customerName : Text;
    items : [CoconutItem];
    vehicleNumber : Text;
    notes : Text;
    createdAt : Time.Time;
    createdBy : Principal;
    createdByName : Text;
  };

  // V2 types (with payment) -- kept for migration only
  type HuskBatchEntryV2 = {
    id : EntryId;
    customerId : CustomerId;
    customerName : Text;
    items : [HuskItem];
    vehicleNumber : Text;
    notes : Text;
    createdAt : Time.Time;
    createdBy : Principal;
    createdByName : Text;
    paymentStatus : PaymentStatus;
    paymentAmount : ?Nat;
  };

  type CoconutBatchEntryV2 = {
    id : EntryId;
    customerId : CustomerId;
    customerName : Text;
    items : [CoconutItem];
    vehicleNumber : Text;
    notes : Text;
    createdAt : Time.Time;
    createdBy : Principal;
    createdByName : Text;
    paymentStatus : PaymentStatus;
    paymentAmount : ?Nat;
  };

  // V3 types (with payment + edit history)
  type HuskBatchEntry = {
    id : EntryId;
    customerId : CustomerId;
    customerName : Text;
    items : [HuskItem];
    vehicleNumber : Text;
    notes : Text;
    createdAt : Time.Time;
    createdBy : Principal;
    createdByName : Text;
    paymentStatus : PaymentStatus;
    paymentAmount : ?Nat;
    lastModifiedAt : ?Time.Time;
    lastModifiedByName : ?Text;
  };

  type HuskBatchEntryInput = {
    customerId : CustomerId;
    customerName : Text;
    items : [HuskItem];
    vehicleNumber : Text;
    notes : Text;
    createdByName : Text;
  };

  type CoconutBatchEntry = {
    id : EntryId;
    customerId : CustomerId;
    customerName : Text;
    items : [CoconutItem];
    vehicleNumber : Text;
    notes : Text;
    createdAt : Time.Time;
    createdBy : Principal;
    createdByName : Text;
    paymentStatus : PaymentStatus;
    paymentAmount : ?Nat;
    lastModifiedAt : ?Time.Time;
    lastModifiedByName : ?Text;
  };

  type CoconutBatchEntryInput = {
    customerId : CustomerId;
    customerName : Text;
    items : [CoconutItem];
    vehicleNumber : Text;
    notes : Text;
    createdByName : Text;
  };

  type ReportFilter = {
    startDate : ?Time.Time;
    endDate : ?Time.Time;
    customerId : ?CustomerId;
    vehicleNumber : ?Text;
    itemType : ?ItemType;
    userId : ?Text;
    paymentStatus : ?PaymentStatus;
  };

  type HuskBatchReport = {
    entries : [HuskBatchEntry];
    totalQuantity : Nat;
    paidCount : Nat;
    pendingCount : Nat;
    totalPaymentAmount : Nat;
  };

  type CoconutBatchReportFilter = {
    startDate : ?Time.Time;
    endDate : ?Time.Time;
    customerId : ?CustomerId;
    vehicleNumber : ?Text;
    coconutType : ?CoconutType;
    paymentStatus : ?PaymentStatus;
  };

  type CoconutBatchReport = {
    entries : [CoconutBatchEntry];
    totalQuantity : Nat;
    paidCount : Nat;
    pendingCount : Nat;
    totalPaymentAmount : Nat;
  };

  // ──────────────────────────────────────────────────────
  // Storage
  // ──────────────────────────────────────────────────────
  var customerIdCounter = 0;
  var vehicleIdCounter = 0;
  var noteIdCounter = 0;
  var batchEntryIdCounter = 0;
  var userIdCounter = 0;

  // Legacy counters kept for stable variable compatibility
  var entryIdCounter = 0;
  var coconutEntryIdCounter = 0;

  let customers = Map.empty<CustomerId, Customer>();
  let vehicles = Map.empty<VehicleId, Vehicle>();
  let vehicleNumberIndex = Map.empty<Text, VehicleId>();
  let notes = Map.empty<Nat, Note>();
  let appUsers = Map.empty<Text, AppUser>();

  // Legacy stable vars kept for upgrade compatibility (do not use)
  let accessControlState : LegacyAccessControlState = {
    var adminAssigned = false;
    userRoles = Map.empty<Principal, LegacyUserRole>();
  };
  let entries = Map.empty<EntryId, LegacyHuskEntry>();
  let coconutEntries = Map.empty<EntryId, LegacyCoconutEntry>();
  let userProfiles = Map.empty<Principal, LegacyUserProfile>();

  // V1 maps kept for upgrade compatibility
  let huskBatchEntries = Map.empty<EntryId, HuskBatchEntryV1>();
  let coconutBatchEntries = Map.empty<EntryId, CoconutBatchEntryV1>();

  // V2 maps kept for upgrade compatibility
  let huskBatchEntriesV2 = Map.empty<EntryId, HuskBatchEntryV2>();
  let coconutBatchEntriesV2 = Map.empty<EntryId, CoconutBatchEntryV2>();

  // V3 maps (active)
  let huskBatchEntriesV3 = Map.empty<EntryId, HuskBatchEntry>();
  let coconutBatchEntriesV3 = Map.empty<EntryId, CoconutBatchEntry>();

  // ──────────────────────────────────────────────────────
  // Auth helpers
  // ──────────────────────────────────────────────────────
  func ensureDefaultAdmin() {
    switch (appUsers.get("Admin")) {
      case (null) {
        appUsers.add("Admin", {
          id = 0;
          username = "Admin";
          pin = "265286";
          name = "Admin";
          role = #admin;
          createdAt = 0;
        });
        if (userIdCounter == 0) { userIdCounter := 1 };
      };
      case (_) {};
    };
  };

  func validateUser(username : Text, pin : Text) : Bool {
    switch (appUsers.get(username)) {
      case (null) { false };
      case (?user) { user.pin == pin };
    };
  };

  func validateAdmin(username : Text, pin : Text) : Bool {
    switch (appUsers.get(username)) {
      case (null) { false };
      case (?user) {
        user.pin == pin and user.role == #admin;
      };
    };
  };

  // ──────────────────────────────────────────────────────
  // Migration
  // ──────────────────────────────────────────────────────

  system func postupgrade() {
    ensureDefaultAdmin();
    // V1 -> V2
    for (e in huskBatchEntries.values()) {
      if (huskBatchEntriesV2.get(e.id) == null) {
        huskBatchEntriesV2.add(e.id, {
          id = e.id;
          customerId = e.customerId;
          customerName = e.customerName;
          items = e.items;
          vehicleNumber = e.vehicleNumber;
          notes = e.notes;
          createdAt = e.createdAt;
          createdBy = e.createdBy;
          createdByName = e.createdByName;
          paymentStatus = #pending;
          paymentAmount = null;
        });
      };
    };
    for (e in coconutBatchEntries.values()) {
      if (coconutBatchEntriesV2.get(e.id) == null) {
        coconutBatchEntriesV2.add(e.id, {
          id = e.id;
          customerId = e.customerId;
          customerName = e.customerName;
          items = e.items;
          vehicleNumber = e.vehicleNumber;
          notes = e.notes;
          createdAt = e.createdAt;
          createdBy = e.createdBy;
          createdByName = e.createdByName;
          paymentStatus = #pending;
          paymentAmount = null;
        });
      };
    };
    // V2 -> V3
    for (e in huskBatchEntriesV2.values()) {
      if (huskBatchEntriesV3.get(e.id) == null) {
        huskBatchEntriesV3.add(e.id, {
          id = e.id;
          customerId = e.customerId;
          customerName = e.customerName;
          items = e.items;
          vehicleNumber = e.vehicleNumber;
          notes = e.notes;
          createdAt = e.createdAt;
          createdBy = e.createdBy;
          createdByName = e.createdByName;
          paymentStatus = e.paymentStatus;
          paymentAmount = e.paymentAmount;
          lastModifiedAt = null;
          lastModifiedByName = null;
        });
      };
    };
    for (e in coconutBatchEntriesV2.values()) {
      if (coconutBatchEntriesV3.get(e.id) == null) {
        coconutBatchEntriesV3.add(e.id, {
          id = e.id;
          customerId = e.customerId;
          customerName = e.customerName;
          items = e.items;
          vehicleNumber = e.vehicleNumber;
          notes = e.notes;
          createdAt = e.createdAt;
          createdBy = e.createdBy;
          createdByName = e.createdByName;
          paymentStatus = e.paymentStatus;
          paymentAmount = e.paymentAmount;
          lastModifiedAt = null;
          lastModifiedByName = null;
        });
      };
    };
  };

  // ──────────────────────────────────────────────────────
  // User Management
  // ──────────────────────────────────────────────────────
  public shared func loginUser(username : Text, pin : Text) : async ?{ username : Text; name : Text; role : UserRole } {
    ensureDefaultAdmin();
    switch (appUsers.get(username)) {
      case (null) { null };
      case (?user) {
        if (user.pin == pin) {
          ?{ username = user.username; name = user.name; role = user.role };
        } else {
          null;
        };
      };
    };
  };

  public shared func adminCreateUser(
    adminUsername : Text,
    adminPin : Text,
    newUsername : Text,
    newPin : Text,
    name : Text,
    role : UserRole,
  ) : async { #ok; #err : Text } {
    if (not validateAdmin(adminUsername, adminPin)) {
      return #err("Unauthorized: Admin credentials required");
    };
    if (appUsers.get(newUsername) != null) {
      return #err("Username already exists");
    };
    if (newPin.size() != 6) {
      return #err("PIN must be exactly 6 digits");
    };
    let id = userIdCounter;
    userIdCounter += 1;
    appUsers.add(newUsername, {
      id;
      username = newUsername;
      pin = newPin;
      name;
      role;
      createdAt = Time.now();
    });
    #ok;
  };

  public shared func adminChangeUserRole(
    adminUsername : Text,
    adminPin : Text,
    targetUsername : Text,
    newRole : UserRole,
  ) : async { #ok; #err : Text } {
    if (not validateAdmin(adminUsername, adminPin)) {
      return #err("Unauthorized: Admin credentials required");
    };
    switch (appUsers.get(targetUsername)) {
      case (null) { #err("User not found") };
      case (?existing) {
        appUsers.add(targetUsername, {
          id = existing.id;
          username = existing.username;
          pin = existing.pin;
          name = existing.name;
          role = newRole;
          createdAt = existing.createdAt;
        });
        #ok;
      };
    };
  };

  public shared func adminChangeUserPin(
    adminUsername : Text,
    adminPin : Text,
    targetUsername : Text,
    newPin : Text,
  ) : async { #ok; #err : Text } {
    if (not validateAdmin(adminUsername, adminPin)) {
      return #err("Unauthorized: Admin credentials required");
    };
    if (newPin.size() != 6) {
      return #err("PIN must be exactly 6 digits");
    };
    switch (appUsers.get(targetUsername)) {
      case (null) { #err("User not found") };
      case (?existing) {
        appUsers.add(targetUsername, {
          id = existing.id;
          username = existing.username;
          pin = newPin;
          name = existing.name;
          role = existing.role;
          createdAt = existing.createdAt;
        });
        #ok;
      };
    };
  };

  public query func adminListUsers(
    adminUsername : Text,
    adminPin : Text,
  ) : async ?[{ username : Text; name : Text; role : UserRole }] {
    if (not validateAdmin(adminUsername, adminPin)) {
      return null;
    };
    let result = List.empty<{ username : Text; name : Text; role : UserRole }>();
    for (u in appUsers.values()) {
      result.add({ username = u.username; name = u.name; role = u.role });
    };
    ?result.toArray();
  };

  public shared func adminDeleteUser(
    adminUsername : Text,
    adminPin : Text,
    targetUsername : Text,
  ) : async { #ok; #err : Text } {
    if (not validateAdmin(adminUsername, adminPin)) {
      return #err("Unauthorized: Admin credentials required");
    };
    if (targetUsername == adminUsername) {
      return #err("Cannot delete your own account");
    };
    if (appUsers.get(targetUsername) == null) {
      return #err("User not found");
    };
    appUsers.remove(targetUsername);
    #ok;
  };

  public shared func changeOwnPin(
    username : Text,
    oldPin : Text,
    newPin : Text,
  ) : async { #ok; #err : Text } {
    if (not validateUser(username, oldPin)) {
      return #err("Invalid credentials");
    };
    if (newPin.size() != 6) {
      return #err("PIN must be exactly 6 digits");
    };
    switch (appUsers.get(username)) {
      case (null) { #err("User not found") };
      case (?existing) {
        appUsers.add(username, {
          id = existing.id;
          username = existing.username;
          pin = newPin;
          name = existing.name;
          role = existing.role;
          createdAt = existing.createdAt;
        });
        #ok;
      };
    };
  };

  // ──────────────────────────────────────────────────────
  // Customers
  // ──────────────────────────────────────────────────────
  public shared ({ caller }) func addCustomer(username : Text, pin : Text, input : CustomerInput) : async CustomerId {
    if (not validateUser(username, pin)) Runtime.trap("Unauthorized");
    let id = customerIdCounter;
    customerIdCounter += 1;
    customers.add(id, { id; name = input.name; phone = input.phone; location = input.location; createdAt = Time.now() });
    id;
  };

  public shared ({ caller }) func updateCustomer(username : Text, pin : Text, id : CustomerId, input : CustomerInput) : async () {
    if (not validateUser(username, pin)) Runtime.trap("Unauthorized");
    switch (customers.get(id)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?existing) {
        customers.add(id, { id; name = input.name; phone = input.phone; location = input.location; createdAt = existing.createdAt });
      };
    };
  };

  public shared ({ caller }) func deleteCustomer(username : Text, pin : Text, id : CustomerId) : async () {
    if (not validateAdmin(username, pin)) Runtime.trap("Unauthorized: Admin only");
    customers.remove(id);
  };

  public query func getAllCustomers(username : Text, pin : Text) : async [Customer] {
    if (not validateUser(username, pin)) Runtime.trap("Unauthorized");
    customers.values().toArray();
  };

  // ──────────────────────────────────────────────────────
  // Vehicles
  // ──────────────────────────────────────────────────────
  func updateVehicle(number : Text) {
    switch (vehicleNumberIndex.get(number)) {
      case (null) {
        let id = vehicleIdCounter;
        vehicleIdCounter += 1;
        vehicles.add(id, { id; vehicleNumber = number; usageCount = 1; lastUsed = Time.now() });
        vehicleNumberIndex.add(number, id);
      };
      case (?id) {
        switch (vehicles.get(id)) {
          case (null) {};
          case (?existing) {
            vehicles.add(id, { id; vehicleNumber = number; usageCount = existing.usageCount + 1; lastUsed = Time.now() });
          };
        };
      };
    };
  };

  public query func getAllVehicles(username : Text, pin : Text) : async [Vehicle] {
    if (not validateUser(username, pin)) Runtime.trap("Unauthorized");
    vehicles.values().toArray();
  };

  public shared ({ caller }) func deleteVehicle(username : Text, pin : Text, id : VehicleId) : async () {
    if (not validateAdmin(username, pin)) Runtime.trap("Unauthorized: Admin only");
    switch (vehicles.get(id)) {
      case (null) { Runtime.trap("Vehicle not found") };
      case (?vehicle) {
        vehicles.remove(id);
        vehicleNumberIndex.remove(vehicle.vehicleNumber);
      };
    };
  };

  // ──────────────────────────────────────────────────────
  // Husk Batch Entries
  // ──────────────────────────────────────────────────────
  public shared ({ caller }) func addHuskBatchEntry(username : Text, pin : Text, input : HuskBatchEntryInput) : async EntryId {
    if (not validateUser(username, pin)) Runtime.trap("Unauthorized");
    let id = batchEntryIdCounter;
    batchEntryIdCounter += 1;
    huskBatchEntriesV3.add(id, {
      id;
      customerId = input.customerId;
      customerName = input.customerName;
      items = input.items;
      vehicleNumber = input.vehicleNumber;
      notes = input.notes;
      createdAt = Time.now();
      createdBy = caller;
      createdByName = input.createdByName;
      paymentStatus = #pending;
      paymentAmount = null;
      lastModifiedAt = null;
      lastModifiedByName = null;
    });
    updateVehicle(input.vehicleNumber);
    id;
  };

  public query func getAllHuskBatchEntries(username : Text, pin : Text) : async [HuskBatchEntry] {
    if (not validateUser(username, pin)) Runtime.trap("Unauthorized");
    huskBatchEntriesV3.values().toArray();
  };

  public shared ({ caller }) func updateHuskBatchEntry(username : Text, pin : Text, id : EntryId, input : HuskBatchEntryInput) : async () {
    if (not validateUser(username, pin)) Runtime.trap("Unauthorized");
    switch (huskBatchEntriesV3.get(id)) {
      case (null) { Runtime.trap("Entry not found") };
      case (?existing) {
        huskBatchEntriesV3.add(id, {
          id;
          customerId = input.customerId;
          customerName = input.customerName;
          items = input.items;
          vehicleNumber = input.vehicleNumber;
          notes = input.notes;
          createdAt = existing.createdAt;
          createdBy = existing.createdBy;
          createdByName = existing.createdByName;
          paymentStatus = existing.paymentStatus;
          paymentAmount = existing.paymentAmount;
          lastModifiedAt = ?Time.now();
          lastModifiedByName = ?username;
        });
        updateVehicle(input.vehicleNumber);
      };
    };
  };

  public shared ({ caller }) func deleteHuskBatchEntry(username : Text, pin : Text, id : EntryId) : async () {
    if (not validateAdmin(username, pin)) Runtime.trap("Unauthorized: Admin only");
    huskBatchEntriesV3.remove(id);
  };

  public shared ({ caller }) func updateHuskBatchPayment(username : Text, pin : Text, id : EntryId, status : PaymentStatus, amount : ?Nat) : async () {
    if (not validateAdmin(username, pin)) Runtime.trap("Unauthorized: Admin only");
    switch (huskBatchEntriesV3.get(id)) {
      case (null) { Runtime.trap("Entry not found") };
      case (?existing) {
        huskBatchEntriesV3.add(id, {
          id = existing.id;
          customerId = existing.customerId;
          customerName = existing.customerName;
          items = existing.items;
          vehicleNumber = existing.vehicleNumber;
          notes = existing.notes;
          createdAt = existing.createdAt;
          createdBy = existing.createdBy;
          createdByName = existing.createdByName;
          paymentStatus = status;
          paymentAmount = amount;
          lastModifiedAt = existing.lastModifiedAt;
          lastModifiedByName = existing.lastModifiedByName;
        });
      };
    };
  };

  public query func getHuskBatchReport(username : Text, pin : Text, filter : ReportFilter) : async HuskBatchReport {
    if (not validateUser(username, pin)) Runtime.trap("Unauthorized");
    let filteredList = List.empty<HuskBatchEntry>();
    var totalQty = 0;
    var paidCnt = 0;
    var pendingCnt = 0;
    var totalPayAmt = 0;

    for (e in huskBatchEntriesV3.values()) {
      let startOk = switch (filter.startDate) { case (null) { true }; case (?s) { e.createdAt >= s } };
      let endOk = switch (filter.endDate) { case (null) { true }; case (?en) { e.createdAt <= en } };
      let customerOk = switch (filter.customerId) { case (null) { true }; case (?cid) { e.customerId == cid } };
      let vehicleOk = switch (filter.vehicleNumber) { case (null) { true }; case (?num) { e.vehicleNumber == num } };
      let userOk = switch (filter.userId) { case (null) { true }; case (?u) { e.createdByName == u } };
      let paymentOk = switch (filter.paymentStatus) {
        case (null) { true };
        case (?ps) { e.paymentStatus == ps };
      };
      if (startOk and endOk and customerOk and vehicleOk and userOk and paymentOk) {
        filteredList.add(e);
        for (item in e.items.values()) { totalQty += item.quantity };
        switch (e.paymentStatus) { case (#paid) { paidCnt += 1 }; case (#pending) { pendingCnt += 1 } };
        switch (e.paymentAmount) { case (null) {}; case (?amt) { totalPayAmt += amt } };
      };
    };
    { entries = filteredList.toArray(); totalQuantity = totalQty; paidCount = paidCnt; pendingCount = pendingCnt; totalPaymentAmount = totalPayAmt };
  };

  // ──────────────────────────────────────────────────────
  // Coconut Batch Entries
  // ──────────────────────────────────────────────────────
  public shared ({ caller }) func addCoconutBatchEntry(username : Text, pin : Text, input : CoconutBatchEntryInput) : async EntryId {
    if (not validateUser(username, pin)) Runtime.trap("Unauthorized");
    let id = batchEntryIdCounter;
    batchEntryIdCounter += 1;
    coconutBatchEntriesV3.add(id, {
      id;
      customerId = input.customerId;
      customerName = input.customerName;
      items = input.items;
      vehicleNumber = input.vehicleNumber;
      notes = input.notes;
      createdAt = Time.now();
      createdBy = caller;
      createdByName = input.createdByName;
      paymentStatus = #pending;
      paymentAmount = null;
      lastModifiedAt = null;
      lastModifiedByName = null;
    });
    updateVehicle(input.vehicleNumber);
    id;
  };

  public query func getAllCoconutBatchEntries(username : Text, pin : Text) : async [CoconutBatchEntry] {
    if (not validateUser(username, pin)) Runtime.trap("Unauthorized");
    coconutBatchEntriesV3.values().toArray();
  };

  public shared ({ caller }) func updateCoconutBatchEntry(username : Text, pin : Text, id : EntryId, input : CoconutBatchEntryInput) : async () {
    if (not validateUser(username, pin)) Runtime.trap("Unauthorized");
    switch (coconutBatchEntriesV3.get(id)) {
      case (null) { Runtime.trap("Entry not found") };
      case (?existing) {
        coconutBatchEntriesV3.add(id, {
          id;
          customerId = input.customerId;
          customerName = input.customerName;
          items = input.items;
          vehicleNumber = input.vehicleNumber;
          notes = input.notes;
          createdAt = existing.createdAt;
          createdBy = existing.createdBy;
          createdByName = existing.createdByName;
          paymentStatus = existing.paymentStatus;
          paymentAmount = existing.paymentAmount;
          lastModifiedAt = ?Time.now();
          lastModifiedByName = ?username;
        });
        updateVehicle(input.vehicleNumber);
      };
    };
  };

  public shared ({ caller }) func deleteCoconutBatchEntry(username : Text, pin : Text, id : EntryId) : async () {
    if (not validateAdmin(username, pin)) Runtime.trap("Unauthorized: Admin only");
    coconutBatchEntriesV3.remove(id);
  };

  public shared ({ caller }) func updateCoconutBatchPayment(username : Text, pin : Text, id : EntryId, status : PaymentStatus, amount : ?Nat) : async () {
    if (not validateAdmin(username, pin)) Runtime.trap("Unauthorized: Admin only");
    switch (coconutBatchEntriesV3.get(id)) {
      case (null) { Runtime.trap("Entry not found") };
      case (?existing) {
        coconutBatchEntriesV3.add(id, {
          id = existing.id;
          customerId = existing.customerId;
          customerName = existing.customerName;
          items = existing.items;
          vehicleNumber = existing.vehicleNumber;
          notes = existing.notes;
          createdAt = existing.createdAt;
          createdBy = existing.createdBy;
          createdByName = existing.createdByName;
          paymentStatus = status;
          paymentAmount = amount;
          lastModifiedAt = existing.lastModifiedAt;
          lastModifiedByName = existing.lastModifiedByName;
        });
      };
    };
  };

  public query func getCoconutBatchReport(username : Text, pin : Text, filter : CoconutBatchReportFilter) : async CoconutBatchReport {
    if (not validateUser(username, pin)) Runtime.trap("Unauthorized");
    let filteredList = List.empty<CoconutBatchEntry>();
    var totalQty = 0;
    var paidCnt = 0;
    var pendingCnt = 0;
    var totalPayAmt = 0;

    for (e in coconutBatchEntriesV3.values()) {
      let startOk = switch (filter.startDate) { case (null) { true }; case (?s) { e.createdAt >= s } };
      let endOk = switch (filter.endDate) { case (null) { true }; case (?en) { e.createdAt <= en } };
      let customerOk = switch (filter.customerId) { case (null) { true }; case (?cid) { e.customerId == cid } };
      let vehicleOk = switch (filter.vehicleNumber) { case (null) { true }; case (?num) { e.vehicleNumber == num } };
      let coconutOk = switch (filter.coconutType) {
        case (null) { true };
        case (?typ) { e.items.find(func(item) { item.coconutType == typ }) != null };
      };
      let paymentOk = switch (filter.paymentStatus) {
        case (null) { true };
        case (?ps) { e.paymentStatus == ps };
      };
      if (startOk and endOk and customerOk and vehicleOk and coconutOk and paymentOk) {
        filteredList.add(e);
        for (item in e.items.values()) { totalQty += item.quantity };
        switch (e.paymentStatus) { case (#paid) { paidCnt += 1 }; case (#pending) { pendingCnt += 1 } };
        switch (e.paymentAmount) { case (null) {}; case (?amt) { totalPayAmt += amt } };
      };
    };
    { entries = filteredList.toArray(); totalQuantity = totalQty; paidCount = paidCnt; pendingCount = pendingCnt; totalPaymentAmount = totalPayAmt };
  };

  // ──────────────────────────────────────────────────────
  // Notes
  // ──────────────────────────────────────────────────────
  public shared ({ caller }) func addNote(username : Text, pin : Text, content : Text) : async Nat {
    if (not validateUser(username, pin)) Runtime.trap("Unauthorized");
    let id = noteIdCounter;
    noteIdCounter += 1;
    notes.add(id, { id; content; createdAt = Time.now(); createdBy = caller });
    id;
  };

  public query func getAllNotes(username : Text, pin : Text) : async [Note] {
    if (not validateUser(username, pin)) Runtime.trap("Unauthorized");
    notes.values().toArray();
  };
};
