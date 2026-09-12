#include "RuntimeScheduler.h"
#include "HostFunctionClosure.h"
#include "HostObjectCallbacks.h"
#include <string>
#include <vector>

namespace expo {

__attribute__((visibility("default")))
RuntimeScheduler *createRuntimeScheduler() {
  return new RuntimeScheduler();
}

__attribute__((visibility("default")))
RuntimeScheduler *createRuntimeScheduler(void *scheduler, RuntimeScheduler::ScheduleFn fn) {
  return new RuntimeScheduler(scheduler, fn);
}

__attribute__((visibility("default")))
void retainRuntimeScheduler(expo::RuntimeScheduler *scheduler) {
  if (scheduler != nullptr) {
    scheduler->retain();
  }
}

__attribute__((visibility("default")))
void releaseRuntimeScheduler(expo::RuntimeScheduler *scheduler) {
  if (scheduler != nullptr) {
    scheduler->release();
  }
}

__attribute__((visibility("default")))
HostFunctionClosure *createHostFunctionClosure(RetainedSwiftPointer::Context context, HostFunctionClosure::Closure *closure, RetainedSwiftPointer::Deallocator deallocator) {
  return new HostFunctionClosure(context, closure, deallocator);
}

__attribute__((visibility("default")))
void HostObjectCallbacks::appendPropNameId(PropNameIds &vector, facebook::jsi::IRuntime &runtime, const char *name) {
  vector.push_back(facebook::jsi::PropNameID::forUtf8(runtime, std::string(name)));
}

} // namespace expo

__attribute__((visibility("default")))
void retainRuntimeScheduler(expo::RuntimeScheduler *scheduler) {
  if (scheduler != nullptr) {
    scheduler->retain();
  }
}

__attribute__((visibility("default")))
void releaseRuntimeScheduler(expo::RuntimeScheduler *scheduler) {
  if (scheduler != nullptr) {
    scheduler->release();
  }
}
