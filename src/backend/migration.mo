import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

module {
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

  type HuskEntry = {
    id : EntryId;
    customerId : CustomerId;
    customerName : Text;
    itemType : ItemType;
    quantity : Nat;
    vehicleNumber : Text;
    notes : Text;
    createdAt : Time.Time;
    createdBy : Principal.Principal;
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
    createdBy : Principal.Principal;
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
    createdBy : Principal.Principal;
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
    createdBy : Principal.Principal;
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
    createdBy : Principal.Principal;
    createdByName : Text;
  };

  type UserProfile = {
    name : Text;
  };

  type OldActor = {
    customerIdCounter : Nat;
    entryIdCounter : Nat;
    vehicleIdCounter : Nat;
    noteIdCounter : Nat;
    coconutEntryIdCounter : Nat;
    customers : Map.Map<CustomerId, Customer>;
    entries : Map.Map<EntryId, HuskEntry>;
    vehicles : Map.Map<VehicleId, Vehicle>;
    vehicleNumberIndex : Map.Map<Text, VehicleId>;
    notes : Map.Map<Nat, Note>;
    coconutEntries : Map.Map<EntryId, CoconutEntry>;
    userProfiles : Map.Map<Principal.Principal, UserProfile>;
  };

  type NewActor = {
    customerIdCounter : Nat;
    entryIdCounter : Nat;
    vehicleIdCounter : Nat;
    noteIdCounter : Nat;
    coconutEntryIdCounter : Nat;
    batchEntryIdCounter : Nat;
    customers : Map.Map<CustomerId, Customer>;
    entries : Map.Map<EntryId, HuskEntry>;
    vehicles : Map.Map<VehicleId, Vehicle>;
    vehicleNumberIndex : Map.Map<Text, VehicleId>;
    notes : Map.Map<Nat, Note>;
    coconutEntries : Map.Map<EntryId, CoconutEntry>;
    userProfiles : Map.Map<Principal.Principal, UserProfile>;
    huskBatchEntries : Map.Map<EntryId, HuskBatchEntry>;
    coconutBatchEntries : Map.Map<EntryId, CoconutBatchEntry>;
  };

  public func run(old : OldActor) : NewActor {
    {
      customerIdCounter = old.customerIdCounter;
      entryIdCounter = old.entryIdCounter;
      vehicleIdCounter = old.vehicleIdCounter;
      noteIdCounter = old.noteIdCounter;
      coconutEntryIdCounter = old.coconutEntryIdCounter;
      batchEntryIdCounter = 0;
      customers = old.customers;
      entries = old.entries;
      vehicles = old.vehicles;
      vehicleNumberIndex = old.vehicleNumberIndex;
      notes = old.notes;
      coconutEntries = old.coconutEntries;
      userProfiles = old.userProfiles;
      huskBatchEntries = Map.empty<EntryId, HuskBatchEntry>();
      coconutBatchEntries = Map.empty<EntryId, CoconutBatchEntry>();
    };
  };
};
