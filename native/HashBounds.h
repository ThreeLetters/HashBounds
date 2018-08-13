#ifndef __HashBounds__
#define __HashBounds__
#include <vector>
#include <iostream>
#include <unordered_map>
#include <cmath>


#include <node.h>
#include <v8.h>
#include <nan.h>

using namespace v8;

struct Bounds {
    int X;
    int Y;
    int WIDTH;
    int HEIGHT;
    bool ALL;
    Bounds() {
        X = Y = WIDTH = HEIGHT = 0;
        ALL = false;
    }
};

struct Node {
   int _HashIndex;
   int _HashSizeX;
   int _HashSizeY;
   int _HashParent;
   bool _InHash;
   int _HashID;
   int k1x,k1y,k2x,k2y;
   unsigned int CHECK;
   Bounds bounds;
    Nan::Persistent<Object> OBJ;
    Node(int id, Nan::Persistent<Object> * obj) {
        CHECK = 0;
        _InHash = false;
        _HashSizeY = _HashSizeX = _HashIndex = 0;
        _HashID = id;
        OBJ.Reset(*obj);
    }
};

class Holder {
    public:
         Holder * PARENT;
         Holder* CHILDREN[4];
        std::unordered_map<int,Node*> MAP;
        int POWER;
        int LVL;
        int LEN;
        int X;
        int Y;
        Bounds BOUNDS;
        int CHILDINDEX;

    Holder( Holder * parent,int x, int y, int power, int lvl) {
        PARENT = parent;
        CHILDINDEX = 0;
        LEN = 0;
        POWER = power;
        LVL = lvl;
        X = x;
        Y = y;
        BOUNDS.X = x << POWER;
        BOUNDS.Y = y << POWER;
        BOUNDS.WIDTH = BOUNDS.HEIGHT = 1 << POWER;
    }
    ~Holder() {
       // std::cout << "Deleting HOLDER X:" << X << "Y:" << Y << std::endl;
      
    }
    void setChild(Holder * self) {
         //std::cout<< PARENT;
        if (PARENT != NULL) {
            (PARENT)->CHILDREN[(PARENT)->CHILDINDEX++] = self;
              //   std::cout<<(PARENT)->CHILDINDEX;
        }
    }
    void set(Node * node) {
        MAP[node->_HashID] = node;
        add();
  //      std::cout << "Added" << LEN;
    }
    void remove(Node * node) {
        MAP.erase(node->_HashID);
        sub();
    }
    void add() {
        LEN++;
        
        if (PARENT != NULL) PARENT->add();
       // else std::cout << "Added" << LEN;
    }
    void sub() {
        LEN--;
        if (PARENT != NULL) PARENT->sub();
    }

    bool checkIntersect(Bounds r1,Bounds r2) {
        int mx1 = r1.X + r1.WIDTH,
            mx2 = r2.X + r2.WIDTH,
            my1 = r1.Y + r1.HEIGHT,
            my2 = r2.Y + r2.HEIGHT;
        return !(r2.X >= mx1 || mx2 <= r1.X || r2.Y >= my1 || my2 <= r1.Y);
    }
    bool _every(v8::Local<Function> & cb,unsigned int QID) {
        v8::Local<v8::Value> argv[1];
        for (auto it : MAP) {
            if (it.second->CHECK != QID) {
                it.second->CHECK = QID;
              argv[0] = Nan::New<Object>(it.second->OBJ);
              Nan::MaybeLocal<Value> retval = Nan::Call(cb,Nan::GetCurrentContext()->Global(),1, argv);
                if (retval.IsEmpty() || !retval.ToLocalChecked()->BooleanValue()) {
                    return false;
                 }
            }
        }
        return true;
    }

    bool everyAll(v8::Local<Function> & cb,unsigned int QID) {
        if (LEN == 0) return true;
      //  std::cout << "Lol" << CHILDINDEX;
        if (!_every(cb,QID)) return false;
        if (CHILDINDEX != 0) {
            for (int i = 0; i < 4; ++i) {
                if (!CHILDREN[i]->everyAll(cb,QID)) return false;;
            }
        }
        return true;
    }
    bool every(Bounds & bounds, v8::Local<Function> & cb,unsigned int QID) {
       if (LEN == 0) return true;
       if (CHILDINDEX == 0) {

           return _every(cb,QID);  
        }
        
        Holder* quadsarr[4];
        int quads = getQuad(bounds, BOUNDS,quadsarr);

       
        if (quads == -1) return everyAll(cb,QID);
        if (!_every(cb,QID)) return false;
        for (int i = 0; i < quads; i++) {
            if (!quadsarr[i]->every(bounds,cb,QID)) return false;
        }
        return true;
    }
    int getQuad(Bounds & bounds, Bounds & bounds2, Holder** out) {
        //if (CHILDINDEX == 0) return [-2];

        int minX = bounds.X,
            minY = bounds.Y,
            maxX = bounds.X + bounds.WIDTH,
            maxY = bounds.Y + bounds.HEIGHT,
            minX2 = bounds2.X,
            minY2 = bounds2.Y,
            maxX2 = bounds2.X + bounds2.WIDTH,
            maxY2 = bounds2.Y + bounds2.HEIGHT,
            halfY = bounds2.Y + (bounds2.HEIGHT >> 1),
            halfX = bounds2.X + (bounds2.WIDTH >> 1);


        bool top = maxY <= halfY;
        bool bottom = minY > halfY;
        bool left = maxX <= halfX;
        bool right = minX > halfX;


        if (top) {
            if (left) {
                //return {0};
                out[0] = CHILDREN[0];
                return 1;
            } else if (right) {
                //return {2};
                out[0] = CHILDREN[2];
                return 1;
            } 
           // return {0, 2};
           out[0] = CHILDREN[0];
           out[1] = CHILDREN[2];
           return 2;
        } else if (bottom) {
            if (left) {
               // return {1};
               out[0] = CHILDREN[1];
               return 1;
            } else if (right) {
               // return {3};
               out[0] = CHILDREN[3];
               return 1;
            }
            //return {1, 3};
            out[0] = CHILDREN[1];
            out[1] = CHILDREN[3];
             return 2;
        }

        if (left) {
           // return {0, 1};
            out[0] = CHILDREN[0];
            out[1] = CHILDREN[1];
            return 2;
        } else if (right) {
           // return {2, 3};
            out[0] = CHILDREN[2];
            out[1] = CHILDREN[3];
            return 2;
        }

        if (bounds.WIDTH < bounds2.WIDTH || bounds.HEIGHT < bounds2.HEIGHT || minX > minX2 || maxX < maxX2 || minY > minY2 || maxY < maxY2) {
          //  return [0, 1, 2, 3];
            out[0] = CHILDREN[0];
            out[1] = CHILDREN[1];
            out[2] = CHILDREN[2];
            out[3] = CHILDREN[3];
             return 4;
        }
        return -1; // too big
    }
};


class Grid {
    public:
        int POWER;
        int LEVEL;
        Grid * PREV;
        Grid * NEXT;
        int SIZEX;
        int SIZEY;
        std::unordered_map<int,Holder* > DATA;
        
    Grid(int g,int p, int sizeX, int sizeY, Grid * pr) {
        POWER = g;
        NEXT = NULL;
        LEVEL = p;
        PREV = pr;
        SIZEX = sizeX;
        SIZEY = sizeY;
        init();
    }

    ~Grid() {
      //  std::cout << "Deleting GRID: " << LEVEL << std::endl;
        for (auto it : DATA) {
           delete it.second;
        }
    }
    void init() {
       // std::cout << SIZEX << std::endl;
        for (int j = 0; j < SIZEX; ++j) {
            int x = (j + 32767) << 16;
            int bx;
            if (PREV != NULL) {
             bx = ((j >> 1) + 32767) << 16;
            }
            for (int i = 0; i < SIZEY; ++i) {

                int by = i >> 1;
                int key = x | (i + 32767);

                Holder * l = NULL;
                if (PREV != NULL) {
                    l = ((PREV)->DATA[bx | (by + 32767)]);
                }
                    
                DATA[key] = new Holder(l, j, i, POWER, LEVEL);
                DATA[key]->setChild(DATA[key]);
            }
        }
    }
    void sendCreateAt(int x,int y) {
        if (PREV == NULL) {
            createAt(x,y);
        } else {
        int X = x << POWER,
            Y = y << POWER;
        Grid * root = PREV;
        while ((root)->PREV != NULL) {
            root = (root)->PREV;
        }
        
        (root)->createAt(X >> (root)->POWER, Y >> (root)->POWER);
        }
    }
    void createAt(int x, int y) { 
        int kx = (x + 32767) << 16;
        int ky = y + 32767;

        Holder * l = NULL;
       if (PREV != NULL) {
           // std::cout << ":" << PREV->LEVEL;
        
            int bx = ((x >> 1) + 32767) << 16;
            int by = y >> 1;

            l = (PREV)->DATA[bx | (by + 32767)];
        }
        int key = kx | ky;
        DATA[key] = new Holder(l, x, y, POWER, LEVEL);
        //return;
        DATA[key]->setChild(DATA[key]);

        if (NEXT != NULL) {
            int dx = x << 1,
                dy = y << 1;
            (NEXT)->createAt(dx, dy);
            (NEXT)->createAt(dx, dy + 1);
            (NEXT)->createAt(dx + 1, dy);
            (NEXT)->createAt(dx + 1, dy + 1);
        }
    }
    void setNext(Grid * self) {
        if (PREV != NULL) {
         (PREV)->NEXT = self;
        }
    }
    void insert(Node * node, Bounds & bounds) {

        int x1 = bounds.X,
            y1 = bounds.Y,
            x2 = bounds.X + bounds.WIDTH,
            y2 = bounds.Y + bounds.HEIGHT;

        int k1x = x1 >> POWER,
            k1y = y1 >> POWER,
            k2x = x2 >> POWER,
            k2y = y2 >> POWER;
        
        node->k1x = k1x;
        node->k2x = k2x;
        node->k1y = k1y;
        node->k2y = k2y;

       // std::cout << k1x << "," << k1y << "-" << k2x << "," << k2y << "P" << POWER;
        for (int j = k1x; j <= k2x; ++j) {
            int x = (j + 32767) << 16;
            for (int i = k1y; i <= k2y; ++i) {
                int ke = x | (i + 32767);
                // console.log(ke)

              
                if (DATA.find(ke) == DATA.end()) sendCreateAt(j, i);

                DATA[ke]->set(node);
            }
        }
    }
    void remove(Node * node) {
        for (int j = node->k1x; j <= node->k2x; ++j) {
            int x = (j + 32767) << 16;
            for (int i = node->k1y; i <= node->k2y; ++i) {
                int ke = x | (i + 32767);
                DATA[ke]->remove(node);
            }
        }
    }
    bool checkChange(Node * node, int k1x, int k1y, int k2x,int k2y) {
        return node->k1x != k1x || node->k1y != k1y || node->k2x != k2x || node->k2y != k2y;
    }

    bool update(Node * node, Bounds & bounds) {
        int x1 = bounds.X,
            y1 = bounds.Y,
            x2 = bounds.X + bounds.WIDTH,
            y2 = bounds.Y + bounds.HEIGHT;

        int k1x = x1 >> POWER,
            k1y = y1 >> POWER,
            k2x = x2 >> POWER,
            k2y = y2 >> POWER;

        if (checkChange(node, k1x,k1y, k2x,k2y)) {
            remove(node);
            insert(node, bounds);
            return true;
        } else {
            return false;
        }
    }

    bool every(Bounds & bounds, v8::Local<Function> & cb, unsigned int QID) {
        
        int x1 = bounds.X,
            y1 = bounds.Y,
            x2 = bounds.X + bounds.WIDTH,
            y2 = bounds.Y + bounds.HEIGHT;

         int k1x = x1 >> POWER,
            k1y = y1 >> POWER,
            k2x = x2 >> POWER,
            k2y = y2 >> POWER;

        for (int j = k1x; j <= k2x; ++j) {
            int x = (j + 32767) << 16;
            for (int i = k1y; i <= k2y; ++i) {
                int key = x | (i + 32767);
                if (DATA.find(key) != DATA.end()) {
                    if (!DATA[key]->every(bounds,cb,QID)) return false;
                }
            }
        }
         return true;
    }
};


class HashBounds {
    public:  
        int LVL;
        int MAXX;
        int MAXY;
        int POWER;
        int MAXVAL;
        int ID;
        Grid ** LEVELS;
        Grid * BASE;
        int * log2;
        int LASTID;
        unsigned int QUERYID;
        std::unordered_map<int,Node*> DATA;
    HashBounds(int power, int lvl, int maxX,int maxY) {
        POWER = power;
        LVL = lvl;
        MAXX = maxX;
        QUERYID = 1;
        MAXY = maxY;
        setUpLog2();
        createLevels();
    }
    ~HashBounds() {
        delete[] log2;
       
        //std::cout << "Deleting HASHBOUNDS" << std::endl;
        for (int i = 0; i < LVL; i++) {
           delete LEVELS[i];
        }
        delete[] LEVELS;
         for (auto key : DATA) {    
              delete key.second;
        }

    }
    unsigned int getQueryID() {
        if (QUERYID >= 4294967295) {
            QUERYID = 1;
        } else QUERYID++;
        return QUERYID;
    }
    void setUpLog2() {
        int pow =(1 << LVL) - 1;
        MAXVAL = pow;
        log2 = new int[pow];
        for (int i = 0; i < pow; ++i) {
            log2[i] = (std::floor(std::log2(i+1)));
        }
    }
    void createLevels() {
        LEVELS = new Grid*[LVL];
        LASTID = 0;
        ID = rand();
        for (int i = LVL - 1; i >= 0; --i) {
            int a = POWER + i;
            float b = (float)(1 << a);
            LEVELS[i] = new Grid(a, i,(int)std::ceil((float)MAXX / b), (int)std::ceil((float)MAXY / b), (i != LVL - 1) ? LEVELS[i+1] : NULL);
            LEVELS[i]->setNext(LEVELS[i]);
            if (i == LVL - 1) BASE = LEVELS[i];
        }
    }
    int getLevel(Node * node,Bounds & bounds) {
        
        
        if (node->_HashSizeX == bounds.WIDTH && node->_HashSizeY == bounds.HEIGHT) {
            return node->_HashIndex;
        }
        int i = (std::max(bounds.WIDTH, bounds.HEIGHT) >> POWER);
        int index;
        if (i >= MAXVAL) {
            index = LVL - 1;
        } else {
            index = log2[i];
        }
      
        node->_HashIndex = index;
        node->_HashSizeX = bounds.WIDTH;
        node->_HashSizeY = bounds.HEIGHT;

        return index;
    }
    bool update(Nan::Persistent<Object> * obj, Local<Object> & node, Bounds & bounds) {
         Node* n = getNode(obj,node);
        if (!n->_InHash) {
             LEVELS[getLevel(n, bounds)]->insert(n, bounds);
             return true;
        }
        int prev = n->_HashIndex;
        int level = getLevel(n, bounds);

        if (prev != level) {
            LEVELS[prev]->remove(n);
            LEVELS[level]->insert(n, bounds);
            return true;
        } else {
            return LEVELS[level]->update(n, bounds);
        }
    }
    Node* getNode(Nan::Persistent<Object> * obj, Local<Object> & node) {
         int hashParent  = (int)Nan::Get(node, Nan::New<String>("_HashParent").ToLocalChecked()).ToLocalChecked()->NumberValue();
         if (hashParent != ID) {
             Nan::Set(node, Nan::New<String>("_HashID").ToLocalChecked(),Nan::New(++LASTID));
            //node->_HashID = ++LASTID;
            Nan::Set(node, Nan::New<String>("_HashParent").ToLocalChecked(),Nan::New(ID));
            //node->_HashParent = ID;
        }
        int hashID  = (int)Nan::Get(node, Nan::New<String>("_HashID").ToLocalChecked()).ToLocalChecked()->NumberValue();
  
        if (DATA.find(hashID) == DATA.end()) {
            DATA[hashID] = new Node(hashID, obj);
        }
        return DATA[hashID];
    }
    void insert(Nan::Persistent<Object> * obj, Local<Object> & node, Bounds & bounds) {
        
         Node* n = getNode(obj,node);

        if (n->_InHash) return;
       // std::cout << getLevel(DATA[hashID], bounds);
       LEVELS[getLevel(n, bounds)]->insert(n, bounds);
    }
    void remove(Local<Object> & node) {
        int hashID  = (int)Nan::Get(node, Nan::New<String>("_HashID").ToLocalChecked()).ToLocalChecked()->NumberValue();
        if (DATA.find(hashID) == DATA.end()) {
            return;
        }
         if (!DATA[hashID]->_InHash || DATA[hashID]->_HashParent != ID) return;
         LEVELS[DATA[hashID]->_HashIndex]->remove(DATA[hashID]);
         delete DATA[hashID];
    }
    bool every(Bounds & bounds,v8::Local<Function> & cb) {

            unsigned int QID = getQueryID();
         if (bounds.ALL) {
        v8::Local<v8::Value> argv[1];
        for (auto it : DATA) {
                if (it.second->CHECK != QID) {
                argv[0] = Nan::New<Object>(it.second->OBJ);
                Nan::MaybeLocal<Value> retval = Nan::Call(cb,Nan::GetCurrentContext()->Global(),1, argv);
                it.second->CHECK = QID;
                if (retval.IsEmpty() || !retval.ToLocalChecked()->BooleanValue()) {
                    return false;
                }
            }
        }
        return true;
        } else {
        return (BASE)->every(bounds,cb,QID);
        }
    }

};

class HashBoundsWrapper : public Nan::ObjectWrap {
    public:
  static void Init(v8::Local<v8::Object> exports);
  private:
  explicit HashBoundsWrapper(int power, int lvl, int maxX, int maxY);
  ~HashBoundsWrapper();

  static void New(const Nan::FunctionCallbackInfo<v8::Value>& info);
  static void insert(const Nan::FunctionCallbackInfo<v8::Value>& info);
  static void update(const Nan::FunctionCallbackInfo<v8::Value>& info);
  static void remove(const Nan::FunctionCallbackInfo<v8::Value>& info);
  static void every(const Nan::FunctionCallbackInfo<v8::Value>& info);
  
  static Nan::Persistent<v8::Function> constructor;
  HashBounds* HASH;
};

#endif