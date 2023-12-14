/**
 * @license
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-FileCopyrightText: The Apache Software Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * This module provides types and utilities for the {@link https://www.w3.org/TR/2017/REC-annotation-model-20170223/
 * | Web Annotation Data Model}.
 *
 * Besides a type definition, it provides convenience functions for dealing with
 * Web Annotations, such as getting the URL(s) of pages an annotation targets,
 * or the plain text content the annotation body. It aims to provide some basic
 * tools to get started writing interoperable annotation tools without having to
 * deal with the intricacies of the data model.
 *
 * @module
 */

export * from '@apache-annotator/annotation';
