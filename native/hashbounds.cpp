#include <nan.h>
#include "HashBounds.h"

Nan::Persistent<v8::Function> HashBoundsWrapper::constructor;


HashBoundsWrapper::HashBoundsWrapper(int power, int lvl, int maxX, int maxY) {
    HASH = new HashBounds(power,lvl,maxX,maxY);
}

HashBoundsWrapper::~HashBoundsWrapper() {
    delete HASH;
}

void HashBoundsWrapper::Init(v8::Local<v8::Object> exports) {
  Nan::HandleScope scope;

  // Prepare constructor template
  v8::Local<v8::FunctionTemplate> tpl = Nan::New<v8::FunctionTemplate>(New);
  tpl->SetClassName(Nan::New("HashBounds").ToLocalChecked());
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  // Prototype
  Nan::SetPrototypeMethod(tpl, "insert", insert);
  Nan::SetPrototypeMethod(tpl, "delete", remove);
  //Nan::SetPrototypeMethod(tpl, "clear", clear);
  //Nan::SetPrototypeMethod(tpl, "forEach", forEach);
  Nan::SetPrototypeMethod(tpl, "every", every);
  //Nan::SetPrototypeMethod(tpl, "toArray", toArray);
  

  constructor.Reset(tpl->GetFunction());
  exports->Set(Nan::New("HashBounds").ToLocalChecked(), tpl->GetFunction());
}

void HashBoundsWrapper::New(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  if (!info.IsConstructCall()) {
    Nan::ThrowTypeError("Use the new operator to create instances");
  }
    // Invoked as constructor: `new MyObject(...)`
    int power = info[0]->Int32Value();
    int lvl = info[1]->Int32Value();
    int maxX = info[2]->IsUndefined() ? 0 : info[2]->Int32Value();
    int maxY = info[3]->IsUndefined() ? 0 : info[3]->Int32Value();

    HashBoundsWrapper* obj = new HashBoundsWrapper(power,lvl,maxX,maxY);
    obj->Wrap(info.This());
    info.GetReturnValue().Set(info.This());
  
}
void js_weak_held_persistent(const Nan::WeakCallbackInfo<int> &data) {
}

void HashBoundsWrapper::insert(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  HashBoundsWrapper* hash = ObjectWrap::Unwrap<HashBoundsWrapper>(info.Holder());
  Local<Object> node = info[0]->ToObject();
  Local<Object> bounds = info[1]->ToObject();
Bounds b = Bounds();
  
    b.X  = (int)Nan::Get(bounds, Nan::New<String>("x").ToLocalChecked()).ToLocalChecked()->NumberValue();
     b.Y = (int)Nan::Get(bounds, Nan::New<String>("y").ToLocalChecked()).ToLocalChecked()->NumberValue();
   b.WIDTH = (int)Nan::Get(bounds, Nan::New<String>("width").ToLocalChecked()).ToLocalChecked()->NumberValue();
    b.HEIGHT= (int)Nan::Get(bounds, Nan::New<String>("height").ToLocalChecked()).ToLocalChecked()->NumberValue();
     Nan::Persistent<Object> pobj(node);
     int garbage = 0;
    pobj.SetWeak(&garbage, js_weak_held_persistent, WeakCallbackType::kParameter);

  
  //std::cout << &pobj << std::endl;

    hash->HASH->insert(&pobj,node,b);
}

void HashBoundsWrapper::update(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  HashBoundsWrapper* hash = ObjectWrap::Unwrap<HashBoundsWrapper>(info.Holder());
  Local<Object> node = info[0]->ToObject();
  Local<Object> bounds = info[1]->ToObject();
Bounds b = Bounds();
  
    b.X  = (int)Nan::Get(bounds, Nan::New<String>("x").ToLocalChecked()).ToLocalChecked()->NumberValue();
     b.Y = (int)Nan::Get(bounds, Nan::New<String>("y").ToLocalChecked()).ToLocalChecked()->NumberValue();
   b.WIDTH = (int)Nan::Get(bounds, Nan::New<String>("width").ToLocalChecked()).ToLocalChecked()->NumberValue();
    b.HEIGHT= (int)Nan::Get(bounds, Nan::New<String>("height").ToLocalChecked()).ToLocalChecked()->NumberValue();
     Nan::Persistent<Object> pobj(node);
     int garbage = 0;
    pobj.SetWeak(&garbage, js_weak_held_persistent, WeakCallbackType::kParameter);

  
  //std::cout << &pobj << std::endl;

    info.GetReturnValue().Set( hash->HASH->update(&pobj,node,b));
}

void HashBoundsWrapper::remove(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  HashBoundsWrapper* hash = ObjectWrap::Unwrap<HashBoundsWrapper>(info.Holder());
  Local<Object> node = info[0]->ToObject();
  
   hash->HASH->remove(node);

}

void HashBoundsWrapper::every(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  HashBoundsWrapper* hash = ObjectWrap::Unwrap<HashBoundsWrapper>(info.Holder());
  int index = 0;
   Bounds b = Bounds();
  if (info[index+1]->IsUndefined()) {
    b.ALL = true;
  } else {
  Local<Object> bounds = info[index++]->ToObject();
    b.X  = (int)Nan::Get(bounds, Nan::New<String>("x").ToLocalChecked()).ToLocalChecked()->NumberValue();
     b.Y = (int)Nan::Get(bounds, Nan::New<String>("y").ToLocalChecked()).ToLocalChecked()->NumberValue();
   b.WIDTH = (int)Nan::Get(bounds, Nan::New<String>("width").ToLocalChecked()).ToLocalChecked()->NumberValue();
    b.HEIGHT= (int)Nan::Get(bounds, Nan::New<String>("height").ToLocalChecked()).ToLocalChecked()->NumberValue();
  }

  v8::Local<Function> cb = info[index].As<Function>();
 // std::cout << b.X << b.WIDTH;
  info.GetReturnValue().Set( hash->HASH->every(b,cb));
}

void InitAll(v8::Local<v8::Object> exports) {
  HashBoundsWrapper::Init(exports);
}

NODE_MODULE(native_hashbounds, InitAll)