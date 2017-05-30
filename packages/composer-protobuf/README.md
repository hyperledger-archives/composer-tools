# Hyperledger Composer Protobuf

This module converts Google Protobuf files into Hyperledger Composer models.
It is currently experimental and has a number of limitations.

Despite these limitations it is a useful tool to convert protobuf data definitions from an existing project to bootstrap a new Composer project. After conversion the generated Composer models will need to be edited to convert some Concepts into Assets, Participants or Transactions.

## Approach

All protobuf types with fields are converted to Composer `Concepts`.

The protobuf type system is mapped to the Composer type system:

* Bytes are converted to `Strings`
* 32 bit int numeric types are mapped to `Integer`
* 64 bit int numeric types are mapped to `Long`
* double and float are mapped to `Double`
* Bool is mapped to `Boolean`

Repeated and optional fields are mapped to Composer `[]` and `optional` respectively.

Default values are supported for Composer primitive types only.

Enumerations are converted.

### Nested Types

Composer does not support type nesting, so all types in a protobuf package are put in the same Composer namespace.

### Namespaces

A Composer file has a single namespace. The namespace of the Composer model is set to the namespace of the last type processed in the protobuf file.

### Imports

The converter does not correctly resolve protobuf imports. If your protobuf files use imports some types may be missing from the generated Composer model.

## Usage

### Install node
Go the composer-protobuf directory and run below command:
`npm install`

### Command Line

You can batch convert a set of `.proto` files under a root directory by running:

`node ./lib/protobuf.js -i <inputDir> -o <outputDir>`

### APIs

You can use the `ProtobufConverter` class to convert a single `.proto` file to a single Composer model file, or use the `ProtobufBatchConverter` class to convert all `.proto` files beneath a directory.
