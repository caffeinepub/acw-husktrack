import Text "mo:core/Text";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import Time "mo:core/Time";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
actor {
  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types
  type CustomerId = Nat;
  type EntryId = Nat;
  type VehicleId = Nat;

  type ItemType = {
    #husk;
    #dry;
    #wet;
    #both;
    #motta;
    #others;
  };

  type CoconutType = {
    #rasi;
    #tallu;
    #others;
  };

  type Customer = {
    id : CustomerId;
    name : Text;
    phone : Text;
    location : Text;
    createdAt : Time.Time;
  };

  type CustomerInput = {
    name : Text;
    phone : Text;
    location : Text;
  };

  type HuskEntry = {
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

  type HuskEntryInput = {
    customerId : CustomerId;
    customerName : Text;
    itemType : ItemType;
    quantity : Nat;
    vehicleNumber : Text;
    notes : Text;
    createdByName : Text;
  };

  type CoconutEntry = {
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

  type CoconutEntryInput = {
    customerId : CustomerId;
    customerName : Text;
    coconutType : CoconutType;
    specifyType : Text;
    quantity : Nat;
    vehicleNumber : Text;
    notes : Text;
    createdByName : Text;
  };

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

  type HuskItem = {
    itemType : ItemType;
    quantity : Nat;
  };

  type CoconutItem = {
    coconutType : CoconutType;
    specifyType : Text;
    quantity : Nat;
  };

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
    userId : ?Principal;
  };

  type HuskBatchReport = {
    entries : [HuskBatchEntry];
    totalQuantity : Nat;
  };

  type CoconutBatchReportFilter = {
    startDate : ?Time.Time;
    endDate : ?Time.Time;
    customerId : ?CustomerId;
    vehicleNumber : ?Text;
    coconutType : ?CoconutType;
  };

  type CoconutBatchReport = {
    entries : [CoconutBatchEntry];
    totalQuantity : Nat;
  };

  type CoconutReport = {
    entries : [CoconutEntry];
    totalQuantity : Nat;
  };

  public type UserProfile = {
    name : Text;
  };

  module Entries {
    public func compareByCreatedAt(entry1 : HuskEntry, entry2 : HuskEntry) : Order.Order {
      Int.compare(entry1.createdAt, entry2.createdAt);
    };
  };

  // Storage
  var customerIdCounter = 0;
  var entryIdCounter = 0;
  var vehicleIdCounter = 0;
  var noteIdCounter = 0;
  var coconutEntryIdCounter = 0;
  var batchEntryIdCounter = 0;

  let customers = Map.empty<CustomerId, Customer>();
  let entries = Map.empty<EntryId, HuskEntry>();
  let vehicles = Map.empty<VehicleId, Vehicle>();
  let vehicleNumberIndex = Map.empty<Text, VehicleId>();
  let notes = Map.empty<Nat, Note>();
  let coconutEntries = Map.empty<EntryId, CoconutEntry>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let huskBatchEntries = Map.empty<EntryId, HuskBatchEntry>();
  let coconutBatchEntries = Map.empty<EntryId, CoconutBatchEntry>();

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Customers
  public shared ({ caller }) func addCustomer(input : CustomerInput) : async CustomerId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only staff can add customers");
    };
    let id = customerIdCounter;
    customerIdCounter += 1;
    let customer : Customer = {
      id;
      name = input.name;
      phone = input.phone;
      location = input.location;
      createdAt = Time.now();
    };
    customers.add(id, customer);
    id;
  };

  public shared ({ caller }) func updateCustomer(id : CustomerId, input : CustomerInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only staff can update customers");
    };
    switch (customers.get(id)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?existing) {
        let updated : Customer = {
          id;
          name = input.name;
          phone = input.phone;
          location = input.location;
          createdAt = existing.createdAt;
        };
        customers.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteCustomer(id : CustomerId) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete customers");
    };
    customers.remove(id);
  };

  public query ({ caller }) func getCustomer(id : CustomerId) : async Customer {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view customers");
    };
    switch (customers.get(id)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?customer) { customer };
    };
  };

  public query ({ caller }) func getAllCustomers() : async [Customer] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view customers");
    };
    customers.values().toArray();
  };

  // HuskEntry
  public shared ({ caller }) func addEntry(input : HuskEntryInput) : async EntryId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only staff can add entries");
    };
    let id = entryIdCounter;
    entryIdCounter += 1;
    let entry : HuskEntry = {
      id;
      customerId = input.customerId;
      customerName = input.customerName;
      itemType = input.itemType;
      quantity = input.quantity;
      vehicleNumber = input.vehicleNumber;
      notes = input.notes;
      createdAt = Time.now();
      createdBy = caller;
      createdByName = input.createdByName;
    };
    entries.add(id, entry);
    updateVehicle(input.vehicleNumber);
    id;
  };

  public shared ({ caller }) func updateEntry(id : EntryId, input : HuskEntryInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only staff can update entries");
    };
    switch (entries.get(id)) {
      case (null) { Runtime.trap("Entry not found") };
      case (?existing) {
        let updated : HuskEntry = {
          id;
          customerId = input.customerId;
          customerName = input.customerName;
          itemType = input.itemType;
          quantity = input.quantity;
          vehicleNumber = input.vehicleNumber;
          notes = input.notes;
          createdAt = existing.createdAt;
          createdBy = existing.createdBy;
          createdByName = input.createdByName;
        };
        entries.add(id, updated);
        updateVehicle(input.vehicleNumber);
      };
    };
  };

  public shared ({ caller }) func deleteEntry(id : EntryId) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete entries");
    };
    entries.remove(id);
  };

  public query ({ caller }) func getEntry(id : EntryId) : async HuskEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view entries");
    };
    switch (entries.get(id)) {
      case (null) { Runtime.trap("Entry not found") };
      case (?entry) { entry };
    };
  };

  public query ({ caller }) func getAllEntries() : async [HuskEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view entries");
    };
    entries.values().toArray();
  };

  // HuskBatchEntry
  public shared ({ caller }) func addHuskBatchEntry(input : HuskBatchEntryInput) : async EntryId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only staff can add batch entries");
    };
    let id = batchEntryIdCounter;
    batchEntryIdCounter += 1;
    let batchEntry : HuskBatchEntry = {
      id;
      customerId = input.customerId;
      customerName = input.customerName;
      items = input.items;
      vehicleNumber = input.vehicleNumber;
      notes = input.notes;
      createdAt = Time.now();
      createdBy = caller;
      createdByName = input.createdByName;
    };
    huskBatchEntries.add(id, batchEntry);
    updateVehicle(input.vehicleNumber);
    id;
  };

  public query ({ caller }) func getHuskBatchEntry(id : EntryId) : async HuskBatchEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view batch entries");
    };
    switch (huskBatchEntries.get(id)) {
      case (null) { Runtime.trap("Batch entry not found") };
      case (?entry) { entry };
    };
  };

  public query ({ caller }) func getAllHuskBatchEntries() : async [HuskBatchEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view batch entries");
    };
    huskBatchEntries.values().toArray();
  };

  public shared ({ caller }) func updateHuskBatchEntry(id : EntryId, input : HuskBatchEntryInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only staff can update batch entries");
    };
    switch (huskBatchEntries.get(id)) {
      case (null) { Runtime.trap("Batch entry not found") };
      case (?existing) {
        let updated : HuskBatchEntry = {
          id;
          customerId = input.customerId;
          customerName = input.customerName;
          items = input.items;
          vehicleNumber = input.vehicleNumber;
          notes = input.notes;
          createdAt = existing.createdAt;
          createdBy = existing.createdBy;
          createdByName = input.createdByName;
        };
        huskBatchEntries.add(id, updated);
        updateVehicle(input.vehicleNumber);
      };
    };
  };

  public shared ({ caller }) func deleteHuskBatchEntry(id : EntryId) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete batch entries");
    };
    huskBatchEntries.remove(id);
  };

  public query ({ caller }) func getHuskBatchReport(filter : ReportFilter) : async HuskBatchReport {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view batch reports");
    };
    let filteredList = List.empty<HuskBatchEntry>();
    var totalQty = 0;

    for (e in huskBatchEntries.values()) {
      let startOk = switch (filter.startDate) {
        case (null) { true };
        case (?start) { e.createdAt >= start };
      };
      let endOk = switch (filter.endDate) {
        case (null) { true };
        case (?end) { e.createdAt <= end };
      };
      let customerOk = switch (filter.customerId) {
        case (null) { true };
        case (?cid) { e.customerId == cid };
      };
      let vehicleOk = switch (filter.vehicleNumber) {
        case (null) { true };
        case (?num) { e.vehicleNumber == num };
      };
      let userOk = switch (filter.userId) {
        case (null) { true };
        case (?u) { e.createdBy == u };
      };

      if (startOk and endOk and customerOk and vehicleOk and userOk) {
        filteredList.add(e);
        for (item in e.items.values()) { totalQty += item.quantity };
      };
    };

    {
      entries = filteredList.toArray();
      totalQuantity = totalQty;
    };
  };

  // CoconutEntry
  public shared ({ caller }) func addCoconutEntry(input : CoconutEntryInput) : async EntryId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only staff can add coconut entries");
    };
    let id = coconutEntryIdCounter;
    coconutEntryIdCounter += 1;
    let entry : CoconutEntry = {
      id;
      customerId = input.customerId;
      customerName = input.customerName;
      coconutType = input.coconutType;
      specifyType = input.specifyType;
      quantity = input.quantity;
      vehicleNumber = input.vehicleNumber;
      notes = input.notes;
      createdAt = Time.now();
      createdBy = caller;
      createdByName = input.createdByName;
    };
    coconutEntries.add(id, entry);
    updateVehicle(input.vehicleNumber);
    id;
  };

  public shared ({ caller }) func updateCoconutEntry(id : EntryId, input : CoconutEntryInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only staff can update coconut entries");
    };
    switch (coconutEntries.get(id)) {
      case (null) { Runtime.trap("Coconut entry not found") };
      case (?existing) {
        let updated : CoconutEntry = {
          id;
          customerId = input.customerId;
          customerName = input.customerName;
          coconutType = input.coconutType;
          specifyType = input.specifyType;
          quantity = input.quantity;
          vehicleNumber = input.vehicleNumber;
          notes = input.notes;
          createdAt = existing.createdAt;
          createdBy = existing.createdBy;
          createdByName = input.createdByName;
        };
        coconutEntries.add(id, updated);
        updateVehicle(input.vehicleNumber);
      };
    };
  };

  public shared ({ caller }) func deleteCoconutEntry(id : EntryId) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete coconut entries");
    };
    coconutEntries.remove(id);
  };

  public query ({ caller }) func getCoconutEntry(id : EntryId) : async CoconutEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view coconut entries");
    };
    switch (coconutEntries.get(id)) {
      case (null) { Runtime.trap("Coconut entry not found") };
      case (?entry) { entry };
    };
  };

  public query ({ caller }) func getAllCoconutEntries() : async [CoconutEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view coconut entries");
    };
    coconutEntries.values().toArray();
  };

  // CoconutBatchEntry
  public shared ({ caller }) func addCoconutBatchEntry(input : CoconutBatchEntryInput) : async EntryId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only staff can add coconut batch entries");
    };
    let id = batchEntryIdCounter;
    batchEntryIdCounter += 1;
    let batchEntry : CoconutBatchEntry = {
      id;
      customerId = input.customerId;
      customerName = input.customerName;
      items = input.items;
      vehicleNumber = input.vehicleNumber;
      notes = input.notes;
      createdAt = Time.now();
      createdBy = caller;
      createdByName = input.createdByName;
    };
    coconutBatchEntries.add(id, batchEntry);
    updateVehicle(input.vehicleNumber);
    id;
  };

  public query ({ caller }) func getCoconutBatchEntry(id : EntryId) : async CoconutBatchEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view coconut batch entries");
    };
    switch (coconutBatchEntries.get(id)) {
      case (null) { Runtime.trap("Coconut batch entry not found") };
      case (?entry) { entry };
    };
  };

  public query ({ caller }) func getAllCoconutBatchEntries() : async [CoconutBatchEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view coconut batch entries");
    };
    coconutBatchEntries.values().toArray();
  };

  public shared ({ caller }) func updateCoconutBatchEntry(id : EntryId, input : CoconutBatchEntryInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only staff can update coconut batch entries");
    };
    switch (coconutBatchEntries.get(id)) {
      case (null) { Runtime.trap("Coconut batch entry not found") };
      case (?existing) {
        let updated : CoconutBatchEntry = {
          id;
          customerId = input.customerId;
          customerName = input.customerName;
          items = input.items;
          vehicleNumber = input.vehicleNumber;
          notes = input.notes;
          createdAt = existing.createdAt;
          createdBy = existing.createdBy;
          createdByName = input.createdByName;
        };
        coconutBatchEntries.add(id, updated);
        updateVehicle(input.vehicleNumber);
      };
    };
  };

  public shared ({ caller }) func deleteCoconutBatchEntry(id : EntryId) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete coconut batch entries");
    };
    coconutBatchEntries.remove(id);
  };

  public query ({ caller }) func getCoconutBatchReport(filter : CoconutBatchReportFilter) : async CoconutBatchReport {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view coconut batch reports");
    };
    let filteredList = List.empty<CoconutBatchEntry>();
    var totalQty = 0;

    for (e in coconutBatchEntries.values()) {
      let startOk = switch (filter.startDate) {
        case (null) { true };
        case (?start) { e.createdAt >= start };
      };
      let endOk = switch (filter.endDate) {
        case (null) { true };
        case (?end) { e.createdAt <= end };
      };
      let customerOk = switch (filter.customerId) {
        case (null) { true };
        case (?cid) { e.customerId == cid };
      };
      let vehicleOk = switch (filter.vehicleNumber) {
        case (null) { true };
        case (?num) { e.vehicleNumber == num };
      };
      let coconutOk = switch (filter.coconutType) {
        case (null) { true };
        case (?typ) {
          e.items.find(
            func(item) { item.coconutType == typ }
          ) != null;
        };
      };

      if (startOk and endOk and customerOk and vehicleOk and coconutOk) {
        filteredList.add(e);
        for (item in e.items.values()) { totalQty += item.quantity };
      };
    };

    {
      entries = filteredList.toArray();
      totalQuantity = totalQty;
    };
  };

  // Vehicles
  func updateVehicle(number : Text) {
    switch (vehicleNumberIndex.get(number)) {
      case (null) {
        let id = vehicleIdCounter;
        vehicleIdCounter += 1;
        let vehicle : Vehicle = {
          id;
          vehicleNumber = number;
          usageCount = 1;
          lastUsed = Time.now();
        };
        vehicles.add(id, vehicle);
        vehicleNumberIndex.add(number, id);
      };
      case (?id) {
        switch (vehicles.get(id)) {
          case (null) { Runtime.trap("Vehicle not found") };
          case (?existing) {
            let updated : Vehicle = {
              id;
              vehicleNumber = number;
              usageCount = existing.usageCount + 1;
              lastUsed = Time.now();
            };
            vehicles.add(id, updated);
          };
        };
      };
    };
  };

  public query ({ caller }) func getAllVehicles() : async [Vehicle] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view vehicles");
    };
    vehicles.values().toArray();
  };

  public shared ({ caller }) func deleteVehicle(id : VehicleId) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete vehicles");
    };
    switch (vehicles.get(id)) {
      case (null) { Runtime.trap("Vehicle not found") };
      case (?vehicle) {
        vehicles.remove(id);
        vehicleNumberIndex.remove(vehicle.vehicleNumber);
      };
    };
  };

  // Notes
  public shared ({ caller }) func addNote(content : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only staff can add notes");
    };
    let id = noteIdCounter;
    noteIdCounter += 1;
    let note : Note = {
      id;
      content;
      createdAt = Time.now();
      createdBy = caller;
    };
    notes.add(id, note);
    id;
  };

  public query ({ caller }) func getAllNotes() : async [Note] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view notes");
    };
    notes.values().toArray();
  };

  // Reports
  public query ({ caller }) func getReport(filter : ReportFilter) : async {
    entries : [HuskEntry];
    totalQuantity : Nat;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reports");
    };
    let filtered = entries.values().toList<HuskEntry>().filter(
      func(e) {
        let startOk = switch (filter.startDate) {
          case (null) { true };
          case (?start) { e.createdAt >= start };
        };
        let endOk = switch (filter.endDate) {
          case (null) { true };
          case (?end) { e.createdAt <= end };
        };
        let customerOk = switch (filter.customerId) {
          case (null) { true };
          case (?cid) { e.customerId == cid };
        };
        let vehicleOk = switch (filter.vehicleNumber) {
          case (null) { true };
          case (?num) { e.vehicleNumber == num };
        };
        let itemOk = switch (filter.itemType) {
          case (null) { true };
          case (?typ) { e.itemType == typ };
        };
        let userOk = switch (filter.userId) {
          case (null) { true };
          case (?u) { e.createdBy == u };
        };
        startOk and endOk and customerOk and vehicleOk and itemOk and userOk;
      }
    );

    let totalQuantity = filtered.foldLeft(0, func(acc, e) { acc + e.quantity });

    {
      entries = filtered.toArray().sort(Entries.compareByCreatedAt);
      totalQuantity;
    };
  };

  public query ({ caller }) func getCoconutReport(filter : {
    startDate : ?Time.Time;
    endDate : ?Time.Time;
    customerId : ?CustomerId;
    vehicleNumber : ?Text;
    coconutType : ?CoconutType;
  }) : async CoconutReport {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view coconut reports");
    };
    let filteredList = coconutEntries.values().toList<CoconutEntry>().filter(
      func(e) {
        let startOk = switch (filter.startDate) {
          case (null) { true };
          case (?start) { e.createdAt >= start };
        };
        let endOk = switch (filter.endDate) {
          case (null) { true };
          case (?end) { e.createdAt <= end };
        };
        let customerOk = switch (filter.customerId) {
          case (null) { true };
          case (?cid) { e.customerId == cid };
        };
        let vehicleOk = switch (filter.vehicleNumber) {
          case (null) { true };
          case (?num) { e.vehicleNumber == num };
        };
        let coconutOk = switch (filter.coconutType) {
          case (null) { true };
          case (?typ) { e.coconutType == typ };
        };
        startOk and endOk and customerOk and vehicleOk and coconutOk;
      }
    );

    let totalQuantity = filteredList.foldLeft(0, func(acc, e) { acc + e.quantity });

    {
      entries = filteredList.toArray();
      totalQuantity;
    };
  };
};
