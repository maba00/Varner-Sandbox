const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { APP_SECRET, getUserId } = require('../utils')
var initData = require('../../init_data')


async function signup(parent, args, context, info) {
    // 1
    const password = await bcrypt.hash(args.password, 10)
    // 2
    const user = await context.db.mutation.createUser({
      data: { ...args, password },
    }, `{ id }`)
  
    // 3
    const token = jwt.sign({ userId: user.id }, APP_SECRET)
  
    // 4
    return {
      token,
      user,
    }
  }
  
  async function login(parent, args, context, info) {
    // 1
    const user = await context.db.query.user({ where: { email: args.email } }, ` { id password } `)
    if (!user) {
      throw new Error('No such user found')
    }
  
    // 2
    const valid = await bcrypt.compare(args.password, user.password)
    if (!valid) {
      throw new Error('Invalid password')
    }
  
    const token = jwt.sign({ userId: user.id }, APP_SECRET)
  
    // 3
    return {
      token,
      user,
    }
  }
  
  function post(parent, args, context, info) {
    const userId = getUserId(context)
    return context.db.mutation.createLink(
      {
        data: {
          url: args.url,
          description: args.description,
          postedBy: { connect: { id: userId } },
        },
      },
      info,
    )
  }

  async function vote(parent, args, context, info) {
    // 1
    const userId = getUserId(context)
  
    // 2
    const linkExists = await context.db.exists.Vote({
      user: { id: userId },
      link: { id: args.linkId },
    })
    if (linkExists) {
      throw new Error(`Already voted for link: ${args.linkId}`)
    }
  
    // 3
    return context.db.mutation.createVote(
      {
        data: {
          user: { connect: { id: userId } },
          link: { connect: { id: args.linkId } },
        },
      },
      info,
    )
  }  

  function initProducts(parent, args, context, info) {
    console.log("init products");
    let deleteAllSkuResult = context.db.mutation.deleteManySkus({where:{skuId_not:"0000000"}},
      info,
    );    
    let deleteAllProducts = context.db.mutation.deleteManyProducts({where:{variantCode_not:"0000000"}},
      info,
    );    
    //const userId = getUserId(context)
    let products = initData.getInitDataProducts();
    console.log("products to insert: " + products.length); 
    var skuCount = 0;
    products.forEach(function(product){
      console.log('create product ' + product.VariantCode );
      let skuList = product.Skus.map(function(sku){ return {skuId:sku.ID, stock:sku.Stock, size:sku.Size, itemEan:sku.itemEan};});
      skuCount+= skuList.length;
      let mappedProduct = {
        variantCode: product.VariantCode,
        styleCode: product.StyleCode,
        url: product.URL,
        name: product.Name,
        description: product.Description,
        productionCountry: product.ProductionCountry,
        price: product.Price,
        offeredPrice: product.OfferedPrice,
        currency:product.Currency,
        catalogs:{set:product.Catalogs},
        color: product.Color,
        category: product.Category,
        looks: {set:product.Looks},
        occasions: {set:product.Occasions},
        chainBrand: product.ChainBrand,
        externalBrand: product.ExternalBrand,
        productClass: product.ProductClass,
        productSubClass: product.ProductSubClass,
        composition: product.Composition,
        materials: {set:product.Materials},
        searchDepartment: {set:product.SearchDepartment},
        care: {set:product.Care},
        mainImage:product.ProductImages.length > 0 ? product.ProductImages[0].Url : "",
        hoverImage:product.ProductImages.length > 1 ? product.ProductImages[1].Url : "",
        skus:null
      }
      context.db.mutation.createProduct(
          {
            data: mappedProduct
          },
          info,
        )
    }
    );

    return {productCount:products.length, skuCount:skuCount};
  }

  function deleteAllProductsAndSkus(parent, args, context, info) {
    console.log("deleteAllProductsAndSkus");
    let deleteAllProducts = context.db.mutation.deleteManyProducts({where:{variantCode_not:"0000000"}},
      info,
    );    
    let deleteAllSkuResult = context.db.mutation.deleteManySkus({where:{skuId_not:"0000000"}},
      info,
    );    
    console.log(deleteAllSkuResult);
    
    return {productCount:deleteAllProducts, skuCount:deleteAllSkuResult};
  }

  
  module.exports = {
      signup,
      login,
      post,
      vote,
      initProducts,
      deleteAllProductsAndSkus
  }