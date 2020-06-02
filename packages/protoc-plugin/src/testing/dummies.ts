/**
 * @fileoverview  Factories to make "dummy" data models.
 * 
 * These factories create models which are internally consistent and have all the data expected of
 * them. However, these should only be used for "don't care" fields of a test. A test should **not**
 * assert on a string literal defined in this file as it would be confusing to readers of the test
 * where the value came from. Instead, any value meaningful to the test should be overridden to keep
 * it visible within the test itself. These dummies simply fill the gap of "I need a value for this
 * parameter, but really don't care what it is, it just needs to not break anything."
 * 
 * For all of these functions, passing `undefined` (or ommitting the property) is asking for the
 * default "dummy" value. Passing `null` does not set that property in the proto, and is useful for
 * testing scenarios where the proto is missing an optional value.
 */

import { MethodDescriptorProto, ServiceDescriptorProto, FileDescriptorProto } from 'google-protobuf/google/protobuf/descriptor_pb';
import { CodeGeneratorRequest, CodeGeneratorResponse } from 'google-protobuf/google/protobuf/compiler/plugin_pb';

/** Creates a dummy {@link MethodDescriptorProto}. */
export function dummyMethod({
    name = 'DummyMethod',
    inputType = 'DummyMethodRequest',
    outputType = 'DummyMethodResponse',
}: {
    name?: string|null,
    inputType?: string|null,
    outputType?: string|null,
} = {}): MethodDescriptorProto {
    const method = new MethodDescriptorProto();
    if (name) method.setName(name);
    if (inputType) method.setInputType(inputType);
    if (outputType) method.setOutputType(outputType);
    return method;
}

/** Creates a dummy {@link ServiceDescriptorProto}. */
export function dummyService({
    name = 'DummyService',
    methods = [ { } ], // Default to a single default dummy method.
}: {
    name?: string|null,
    methods?: Array<Parameters<typeof dummyMethod>[0]>,
} = {}): ServiceDescriptorProto {
    const service = new ServiceDescriptorProto();
    if (name) service.setName(name);
    service.setMethodList(methods?.map(dummyMethod));
    return service;
}

/** Creates a dummy {@link FileDescriptorProto}. */
export function dummyFileDescriptor({
    pkg = 'dummy.package',
    services = [ { } ], // Default to a single default dummy service.
}: {
    pkg?: string|null,
    services?: Array<Parameters<typeof dummyService>[0]>,
} = {}): FileDescriptorProto {
    const fileDescriptor = new FileDescriptorProto();
    if (pkg) fileDescriptor.setPackage(pkg);
    fileDescriptor.setServiceList(services.map(dummyService));
    return fileDescriptor;
}

/** Creates a dummy {@link CodeGeneratorRequest}. */
export function dummyCodegenRequest({
    filesToGenerate = [ 'dummy_file.proto' ],
    protoFiles = [ {} ], // Default to a single default dummy file descriptor.
}: {
    filesToGenerate?: string[],
    protoFiles?: Array<Parameters<typeof dummyFileDescriptor>[0]>,
} = {}): CodeGeneratorRequest {
    const req = new CodeGeneratorRequest();
    req.setFileToGenerateList(filesToGenerate);
    req.setProtoFileList(protoFiles.map(dummyFileDescriptor));
    return req;
}

/** Creates a dummy {@link CodeGeneratorResponse.File}. */
export function dummyCodegenResponseFile({
    name = 'dummy_codgen_file.ext',
    content = 'Dummy file content',
}: {
    name?: string|null,
    content?: string|null,
} = {}): CodeGeneratorResponse.File {
    const file = new CodeGeneratorResponse.File();
    if (name) file.setName(name);
    if (content) file.setContent(content);
    return file;
}

/** Creates a dummy {@link CodeGeneratorResponse}. */
export function dummyCodgenResponse({
    files = [],
}: {
    files?: Array<Parameters<typeof dummyCodegenResponseFile>[0]>,
} = {}): CodeGeneratorResponse {
    const res = new CodeGeneratorResponse();
    res.setFileList(files.map(dummyCodegenResponseFile));
    return res;
}