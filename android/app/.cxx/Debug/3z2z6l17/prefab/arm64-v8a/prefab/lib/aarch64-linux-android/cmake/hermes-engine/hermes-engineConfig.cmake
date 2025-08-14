if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "/Users/federico/.gradle/caches/8.13/transforms/fa03d1ffcf2d88d54ed6c7d80f87d2da/transformed/hermes-android-0.79.5-debug/prefab/modules/libhermes/libs/android.arm64-v8a/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/federico/.gradle/caches/8.13/transforms/fa03d1ffcf2d88d54ed6c7d80f87d2da/transformed/hermes-android-0.79.5-debug/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

