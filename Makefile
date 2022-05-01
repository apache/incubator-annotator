# Licensed under the Apache License, Version 2.0 (the "License"); you may not
# use this file except in compliance with the License. You may obtain a copy of
# the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations under
# the License.
#
# SPDX-FileCopyrightText: The Apache Software Foundation
# SPDX-License-Identifier: Apache-2.0

# What is the prerelease version?
vsn_pre = $(shell git describe --tags --always --first-parent \
	| grep -Eo -- '(-rc\.[0-9]+)?$$' \
	2>/dev/null)

# What is the release version?
vsn_rel = $(shell git describe --tags --always --first-parent \
	| grep -Eo -- '^v[0-9]+\.[0-9]\.[0-9]+' \
	| tail -c +2 \
	2>/dev/null)

# What is the release tag?
vsn_tag = $(shell git describe --tags --always --first-parent \
	| grep -Eo -- '^v[0-9]+\.[0-9]\.[0-9]+(-rc.[0-9]+)?$$' \
	2>/dev/null)

distdir = apache-annotator-$(vsn_rel)-incubating
disttar = apache-annotator-$(vsn_rel)$(vsn_pre)-incubating.tar.gz

.PHONY: all
all: build

.PHONY: build
build:
	@yarn

.PHONY: clean
clean:
	@yarn run clean

.PHONY: check
check: lint test

.PHONY: lint
lint: build
	@yarn lint

.PHONY: test
test: build
	@yarn test

ifeq ($(vsn_tag),)

.PHONY: dist
dist:
	$(error No tag found for release)

else

.PHONY: dist
dist:
	@rm -rf $(distdir)
	@git archive --output $(disttar) --prefix $(distdir)/ $(vsn_tag)
	@echo "Done: $(disttar)"

endif

.PHONY: distcheck
distcheck: dist
	@tar xzf $(disttar)
	@make -C $(distdir) check

.PHONY: distsign
distsign: dist
	@gpg -ab $(disttar)
	@sha256sum $(disttar) > $(disttar).sha256
	@sha512sum $(disttar) > $(disttar).sha512
